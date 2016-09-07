from flask import Flask, jsonify, render_template, request, make_response
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from flask_cors import CORS, cross_origin
import time
import json
import pickle
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from PIL import Image
import os
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from threading import Thread, Lock
import threading

app = Flask(__name__)
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})

taskThreadList = []

def fullpage_screenshot(driver, file):
    print("Starting chrome full page screenshot workaround ...")

    total_width = driver.execute_script("return document.body.offsetWidth")
    total_height = driver.execute_script("return document.body.parentNode.scrollHeight")
    viewport_width = driver.execute_script("return document.body.clientWidth")
    viewport_height = driver.execute_script("return window.innerHeight")
    print("Total: ({0}, {1}), Viewport: ({2},{3})".format(total_width, total_height, viewport_width, viewport_height))
    rectangles = []

    i = 0
    while i < total_height:
        ii = 0
        top_height = i + viewport_height

        if top_height > total_height:
            top_height = total_height

        while ii < total_width:
            top_width = ii + viewport_width

            if top_width > total_width:
                top_width = total_width

            print("Appending rectangle ({0},{1},{2},{3})".format(ii, i, top_width, top_height))
            rectangles.append((ii, i, top_width, top_height))

            ii = ii + viewport_width

        i = i + viewport_height

    stitched_image = Image.new('RGB', (total_width, total_height))
    previous = None
    part = 0

    for rectangle in rectangles:
        if not previous is None:
            driver.execute_script("window.scrollTo({0}, {1})".format(rectangle[0], rectangle[1]))
            print("Scrolled To ({0},{1})".format(rectangle[0], rectangle[1]))
            time.sleep(0.2)

        file_name = "part_{0}.png".format(part)
        print("Capturing {0} ...".format(file_name))

        driver.get_screenshot_as_file(file_name)
        screenshot = Image.open(file_name)

        if rectangle[1] + viewport_height > total_height:
            offset = (rectangle[0], total_height - viewport_height)
        else:
            offset = (rectangle[0], rectangle[1])

        print("Adding to stitched image with offset ({0}, {1})".format(offset[0], offset[1]))
        stitched_image.paste(screenshot, offset)

        del screenshot
        os.remove(file_name)
        part = part + 1
        previous = rectangle

    stitched_image.save(file)
    print("Finishing chrome full page screenshot workaround...")
    return True


def waitForElement(driver, xpath):
    timeout = 5
    try:
        element_present = EC.presence_of_element_located((By.XPATH, xpath))
        WebDriverWait(driver, timeout).until(element_present)
    except TimeoutException:
        errorMessage = "TimeoutException & No Such Element"
        print(errorMessage)


def connectUrl(driver, xpath, contents):
    driver.get(contents[0])


def inputText(driver, xpath, contents):
    splitPath = "//" + xpath.split('/')[-1]
    waitForElement(driver, splitPath)
    driver.find_element_by_xpath(splitPath).send_keys(contents[0])
    return "inputText"


def clickButton(driver, xpath, contents):
    splitPath = "//" + xpath.split('/')[-2] + "/" + xpath.split('/')[-1]
    waitForElement(driver, splitPath)
    driver.find_element_by_xpath(splitPath).click()
    return "clickButton"


def drawImage(driver, element, saveName):
    location = element.location
    size = element.size

    screenshotName = "Screenshot" + threading.current_thread().getName() + ".png"
    fullpage_screenshot(driver, screenshotName)
    # driver.save_screenshot('screenshot.png')
    # time.sleep(2)
    im = Image.open(screenshotName)
    left = location['x']
    top = location['y']
    right = location['x'] + size['width']
    bottom = location['y'] + size['height']

    im = im.crop((int(left), int(top), int(right), int(bottom)))
    im.save(saveName)


def drawCanvas(driver, element, saveName, canv):
    drawImage(driver, element, 'pdfTemp.png')
    canv.drawImage('pdfTemp.png', 0, 0)


def onCrawling(driver, xpath, contents):
    splitPath = "//" + xpath.split('/')[-2] + "/" + xpath.split('/')[-1]
    imagePath = "//" + xpath.split('/')[-4] + "/" + xpath.split('/')[-3] + "/" + xpath.split('/')[-2]

    if (contents[0] == "PICKLE"):
        waitForElement(driver, splitPath)
        targetData = driver.find_element_by_xpath(splitPath).text
        with open(contents[1], 'wb') as f:
            pickle.dump(targetData, f)

    elif (contents[0] == "JSON"):
        waitForElement(driver, splitPath)
        targetData = driver.find_element_by_xpath(splitPath).text
        with open(contents[1], 'w') as f:
            json.dump(targetData, f, ensure_ascii=False)

    elif (contents[0] == "TXT"):
        waitForElement(driver, splitPath)
        targetData = driver.find_element_by_xpath(splitPath).text
        f = open(contents[1], 'w+')
        f.write(targetData)
        f.close()

    elif (contents[0] == "PNG"):
        print("[PNG]")
        # png = driver.get_screenshot_as_png()
        # open(contents[1], "wb").write(png)
        waitForElement(driver, imagePath)
        element = driver.find_element_by_xpath(imagePath)
        drawImage(driver, element, contents[1])

    elif (contents[0] == "PDF"):
        waitForElement(driver, imagePath)
        element = driver.find_element_by_xpath(imagePath)
        canv = canvas.Canvas(contents[1], pagesize=A4)
        drawCanvas(driver, element, contents[1], canv)
        canv.save()

    elif(contents[0] == "VIDEO"):
        videoUrl = contents[2]
        yougetCommand = '';
        if os.name == "posix":  # OS가 Unix계열일 경우 (MacOS 포함)
            yougetCommand = 'LC_CTYPE=en_US.UTF-8 && you-get ' + videoUrl
        else:  # OS가 windows일 경우
            yougetCommand = 'chcp 65001 && you-get ' + videoUrl
        os.system(yougetCommand)

    return "onCrawling"


def isNumber(s):
    try:
        float(s)
        return True
    except ValueError:
        return False


def onIf(driver, xpath, contents, data, index, listIf):
    # targetValue = driver.find_element_by_xpath(xpath).get_attribute("text")
    waitForElement(driver, xpath)
    targetValue = driver.find_element_by_xpath(xpath).text
    targetValue = targetValue.strip()
    if(contents[0][0:1] == "!="):
        contentsValue = contents[0][2:]
    else:
        contentsValue = contents[0][1:]

    if (isNumber(targetValue)):
        targetValue = float(targetValue)
    if (isNumber(contentsValue)):
        contentsValue = float(contentsValue)

    if (contents[0][0] == ">"):
        if (targetValue > contentsValue):
            print(">>>>>>>>>>> true")
            return 1
        else:
            print(">>>>>>>>>>> false")
            return 2
    elif (contents[0][0] == "<"):
        if (targetValue < contentsValue):
            print("<<<<<<<<<<< true")
            return 1
        else:
            print("<<<<<<<<<<< false")
            return 2
    elif (contents[0][0] == "="):
        if (targetValue == contentsValue):
            print("========== true")
            return 1
        else:
            print("========== false")
            return 2
    elif (contents[0][0:2] == "!="):
        if (targetValue != contentsValue):
            print("!=!=!=!=!=!= true")
            return 1
        else:
            print("!=!=!=!=!=!= false")
            return 2

    return 3


def onElse(driver, xpath, contents, data, index, listIf, determineIf):
    return 0

def onFor(driver, xpath, contents, data, index, listFor):
    indexOfFor = int(data[index]['contents'][0])
    curFor = listFor.pop(0)
    addrOfFor = int(curFor[0])
    addrOfForEnd = int(curFor[1])

    for i in range(indexOfFor):
        for j in range(addrOfFor + 1, addrOfForEnd):
            listLen = len(data[j]['contents'][0].split(','))
            if listLen == 1:
                commandFunc.get(data[j]['command'])(driver, data[j]['xpath'], data[j]['contents'])
            else:
                if i >= listLen:
                    commandFunc.get(data[j]['command'])(driver, data[j]['xpath'], [data[j]['contents'][0].split(',').pop()])
                else:
                    commandFunc.get(data[j]['command'])(driver, data[j]['xpath'], [data[j]['contents'][0].split(',')[i]])



    return addrOfForEnd


def onEnd(driver, xpath, contents):
    return "onEnd"

commandFunc = {
    "URL": connectUrl,
    "INPUT": inputText,
    "CLICK": clickButton,
    "CRAWLING": onCrawling,
    "IF": onIf,
    "ELIF": onIf,
    "ELSE": onElse,
    "END": onEnd,
    "FOR": onFor
}

def runTask(data):
    #TODO   Windows, UNIX 계열이외에 예외처리 필요
    if os.name == "posix":      # OS가 Unix계열일 경우 (MacOS 포함)
        driver = webdriver.Chrome(os.getcwd() + "/chromedriver")
    else:                       # OS가 windows일 경우
        driver = webdriver.Chrome("chromedriver.exe")

    driver.maximize_window()
    print(data)

    print("jool>>>>>>>>>>>")

    # For list
    listFor = []
    isList = False

    # If list
    listIf = [[[]]]
    isIf = False
    isElse = False
    ifCount = -1;
    ifInnerCount = 0;

    ### task1 pass-1        make list!
    for index in range(len(data)):
        tempCommand = data[index]['command']
        if (tempCommand == "FOR"):
            listFor.append([index, 0])
            isList = True
        elif (tempCommand == "IF"):
            ifCount += 1
            ifInnerCount = 0
            listIf.append([])
            listIf[ifCount].insert(ifInnerCount, ["IF", index, 0])
            isIf = True
        elif (tempCommand == "ELIF"):
            ifInnerCount += 1
            listIf[ifCount].insert(ifInnerCount, ["ELIF", index, 0])
            isIf = True
        elif (tempCommand == "ELSE"):
            ifInnerCount += 1
            listIf[ifCount].insert(ifInnerCount, ["ELSE", index, 0])
            isElse = True

        if ((tempCommand == "END") & (isList == True)):
            isList = False
            listFor[len(listFor) - 1][1] = index
        elif ((tempCommand == "END") & (isIf == True)):
            isIf = False
            listIf[ifCount][ifInnerCount][2] = index
        elif ((tempCommand == "END") & (isElse == True)):
            isElse = False
            listIf[ifCount][ifInnerCount][2] = index

    print('list for >> ')
    print(listFor)
    print('list for << ')
    print('list if >> ')
    print(listIf)
    print('list if << ')

    ### Task pass-2
    try:
        result = ""
        determineIf = 0     # 0: 판별전    1: True     2: False
        addrOfIfEnd = -1
        addrOfForEnd = -2

        for index in range(len(data)):
            ### Action 수행
            if data[index]['command'] == "FOR":
                addrOfForEnd = commandFunc.get(data[index]['command'])(driver, data[index]['xpath'], data[index]['contents'], data, index,listFor)
            elif data[index]['command'] == "IF":
                determineIf = commandFunc.get(data[index]['command'])(driver, data[index]['xpath'], data[index]['contents'], data, index, listIf)
                if(determineIf == 1):   # True일 경우
                    listIf[0].pop(0)
                    addrOfIfEnd = -1
                    print("계속진행")
                    print(listIf)
                elif(determineIf == 2):
                    addrOfIfEnd = listIf[0][0].pop(2)
                    listIf[0].pop(0)
                    print("End로 진행")
                    print(listIf)
            elif data[index]['command'] == "ELIF":
                if (determineIf == 1):  # True일 경우
                    addrOfIfEnd = listIf[0][0].pop(2)
                    listIf[0].pop(0)
                    print("End로 진행")
                    print(listIf)
                elif (determineIf == 2):
                    determineIf = commandFunc.get(data[index]['command'])(driver, data[index]['xpath'], data[index]['contents'], data, index, listIf)
                    if (determineIf == 1):  # True일 경우
                        listIf[0].pop(0)
                        print("계속진행")
                        print(listIf)
                    elif (determineIf == 2):
                        addrOfIfEnd = listIf[0][0].pop(2)
                        listIf[0].pop(0)
                        print("End로 진행")
                        print(listIf)

            elif data[index]['command'] == "ELSE":
                commandFunc.get(data[index]['command'])(driver, data[index]['xpath'], data[index]['contents'], data, index, listIf, determineIf)
                if (determineIf == 1):  # True일 경우
                    addrOfIfEnd = listIf[0][0].pop(2)
                    listIf[0].pop(0)
                    print("End로 진행")
                    print(listIf)
                elif (determineIf == 2):
                    listIf[0].pop(0)
                    print("계속 진행")
                    print(listIf)
            else:
                if index == addrOfIfEnd:
                    addrOfIfEnd = -1
                if (addrOfIfEnd == -1) & (index > addrOfForEnd):
                    result = commandFunc.get(data[index]['command'])(driver, data[index]['xpath'], data[index]['contents'])

        print("endJool <<<<<<<<<<<<<<<<<<<<<<")

    except:
        return jsonify(resultCode=1)

@app.route('/_analysis_json', methods=['GET', 'OPTIONS', 'POST'])
@cross_origin()
def analysis_json():
    print("[analysis_json]")
    # data = json.dumps({})
    ###open local json file
    # if request.method == 'GET':
    #    with open('commands.json') as f:
    #        data = json.load(f)

    ###receive ajax json
    # else:
    # data = request.get_json(force=True)
    try:
        data = request.get_json(force=True)
        print(data)
        curTaskId = data["taskId"]
        curActions = data["actions"]
    except:
        return jsonify(resultCode=1)

    taskThread = Thread(name=curTaskId, target=runTask, args=[curActions])
    taskThreadList.append(taskThread)
    taskThread.start()

    time.sleep(5)
    print("[End : analysis_json]")
    return jsonify(resultCode=1, taskId=taskThread.getName())

@app.route('/')
def index():
    return render_template('bar.html')

if __name__ == "__main__":
    app.run(debug=True)