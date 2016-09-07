/**
 * Copyright 2011 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @authocr ChanHaRi
 * $ : element html
 * a : array
 * n : Number
 * g : global
 * s : string
 * j : json
 */
// Constants.

var MOVE_COOLDOWN_PERIOD_MS = 400;
var X_KEYCODE = 88;

// Global variables.
var gnLastMoveTimeInMs = 0;
var gnCounter = 1;

//Elements
var $gaQueryEl = [];	//xPath element 관리 리스트
var $gaResultsEl = []; //tag의 value element 관리 리스트
var $gaNodeCountEl = document.getElementById('node-count');
var $nodeCountText = document.createTextNode('0');

///////////////
var gnTaskId = 0; //현재 진행하고 있는 TaskId
var gajTasks = [];
var gURLFlag=0; // Chrome Extension에서 가져올때는 URL 이벤트를 발생 시키지 않는다.
//Chrome Storage Key Constant
const TASK_KEY = "TASK"; // gnTaskId
const TASK_DATE ="TASK_DATE"; // Date per TaskID
const TASK_LOOP_COUNT ="TASK_LOOP_COUNT"; // LoopCount per TASKID

//TODO Task 페이지 관리
$(function () {
    $('a.taskSelectFunction').bind('click', function () {

        if(gnTaskId !=this.id) {
            gnTaskId = this.id;

            //TODO 새로 지우고 다시 update를 해야한다.
            while (gnCounter>1) {

                $gaQueryEl[gnCounter - 1].removeEventListener('keyup', evaluateQuery);
                $gaQueryEl[gnCounter - 1].removeEventListener('mouseup', evaluateQuery);

                $gaQueryEl.pop();
                $gaResultsEl.pop();

                $("div#form" + (gnCounter)).remove();
                $("br:last").remove();
                gnCounter--;
            }

            if(!loadStorage())//비여있다면 하나 넣어줘야한다.
            {
                $('input#x_path1').val('');
                $('input#input_text1').val('');

                $('select#select_command1').val('Select commands').change();
                $("button.select_logic"+gnCounter).remove();//무조건 다 지운다. 빈거이기 때문
                $('select#select_extention1').val('Select Extention').change();//지우지못했어 css만 지웠음..
                $('div#div_select1').hide();

                $('input#schedule_date').val('');
                $('input#loop_count').val('');
                $('label#information1').val('');
                // objDate["data"]= $('input#schedule_date').val();
                // objLoopCount["data"]= $('input#loop_count').val();


            }

        }
    });
});


// TODO Seongha
// 일단 화면이 로드되기 전에 있는지 확인을 하는 부분!
/**
 * 처음엔 아마도 HTML을 먼저 그린다고했었던거같은데???
 * MakeJson에서 .... 여기에서 Backup을 하는 부분도 추가를 하는 것이다.
 */

$(window).load(function () {
    //익스텐션이 꺼질때도 발생한다.
    loadStorage();
});

function saveStorage(key, data) {
    var obj = {};
    obj[key] = data;
    // alert("save : "+obj[key][0].xPath);

    chrome.storage.sync.set(obj, function () {
        console.log("save chorme storage -----------------");
        console.log(data);
    });
}

function loadStorage() {
    chrome.storage.sync.get((TASK_KEY + gnTaskId), function (item) {
        if (item[(TASK_KEY + gnTaskId)] === undefined) {
            //alert("Not exist saved Data");
            console.log("Not exist saved Data");
            return false;
        } else {
            gajTasks[gnTaskId] = item[(TASK_KEY + gnTaskId)];
            loadInputData();
            return true;
        }
    });
}

function loadInputData() {
    var task = gajTasks[gnTaskId];
    for (var i = 1; i <= task.length; i++) {
        $(function () {
            $('input#x_path' + i).val(task[i - 1].xPath)
        });
        $(function () {
            $('input#input_text' + i).val(task[i - 1].inputText)
        });
        $(function () {
            if(task[i - 1].selectCommand == "URL")
                gURLFlag=1;
            $('select#select_command' + i).val(task[i - 1].selectCommand).change()
        });

        if (task[i - 1].selectExtention != undefined) {
            $(function () {
                $('select#select_extention' + i).val(task[i - 1].selectExtention).change()
            });
        }
        if (i < task.length)
            $("button#append").click();
    }
    // //
    // objDate["data"]= $('input#schedule_date').val();
    // objLoopCount["data"]= $('input#loop_count').val();

    //Date
    var keyDate = (TASK_DATE + gnTaskId);
    console.log("Chrome get------------------------------");
    console.log(keyDate);
    chrome.storage.sync.get(keyDate, function (item) {
        if(item[keyDate]!= undefined) {
            $('input#schedule_date').val(item[keyDate]);
            console.log(item[keyDate]);
        }
    });

    //LOOP Count
    var keyLoopCount= (TASK_LOOP_COUNT + gnTaskId);
    console.log(keyLoopCount);
    chrome.storage.sync.get(keyLoopCount, function (item) {
        if(item[keyLoopCount]!=undefined) {
            $('input#loop_count').val(item[keyLoopCount]);
            console.log(item[keyLoopCount]);
        }
    })


}


$(function () {
    $('button#clear').bind('click', function () {
        //TODO claer 전체하는 게아니라 ID를 가지고 부분만 delete를 하도록 수정해야함.
        // chrome.storage.sync.clear(function () {
        //     alert("Chrome Storage CLEAR");
        // });

        chrome.storage.sync.remove((TASK_KEY+gnTaskId),function()
        {
            alert("Chrome Storage remove : "+(TASK_KEY+gnTaskId));

            //TODO 새로 지우고 다시 update를 해야한다.
            while (gnCounter>1) {

                $gaQueryEl[gnCounter - 1].removeEventListener('keyup', evaluateQuery);
                $gaQueryEl[gnCounter - 1].removeEventListener('mouseup', evaluateQuery);

                $gaQueryEl.pop();
                $gaResultsEl.pop();

                $("div#form" + (gnCounter)).remove();
                $("br:last").remove();
                gnCounter--;
            }

            //TODO 새로 그리기 //바뀌어진 아이디로 그리면된다.

            if(!loadStorage())//비여있다면 하나 넣어줘야한다.
            {
                $('input#x_path1').val('');
                $('input#input_text1').val('');

                $('select#select_command1').val('Select commands').change();
                $("button.select_logic"+gnCounter).remove();//무조건 다 지운다. 빈거이기 때문
                $('select#select_extention1').val('Select Extention').change();//지우지못했어 css만 지웠음..
                $('div#div_select1').hide();
                $('label#information1').val('');
                $('input#loop_count').val('');
            }

        });



    });
});


$gaQueryEl.push($("div#form" + gnCounter + ".defaultaction" + ",input.name")[1]);
$gaResultsEl.push($("label.information")[0])
$gaNodeCountEl.appendChild($nodeCountText);

var evaluateQuery = function () {	//마우스로 영역 선택시 리퀘스트 보냄
    chrome.runtime.sendMessage({
        type: 'evaluate',
        query: $gaQueryEl[gnCounter - 1].value
    });
};

var handleRequest = function(request, sender, cb) {
    if (request.type === 'update') {
        if (request.query !== null) {
            $gaQueryEl[gnCounter-1].value = request.query;
        }
        if (request.results !== null) {
            if(request.results[0].length >300)
                $gaResultsEl[gnCounter-1].innerHTML = request.results[0].slice(0,300);
            else
                $gaResultsEl[gnCounter-1].innerHTML = request.results[0];
            $nodeCountText.nodeValue = request.results[1];
        }
    }
    if(request.type === 'receiveURL'){
        console.log(request.results)
        $('input#input_text' + gnCounter).val(request.results.url);
        //console.log("prev url : " + document.referrer);
        //$('input#input_text' + gnCounter).val(document.referrer);
    }
    if(request.type === 'executeTask1'){
        $('a.taskSelectFunction#0').click();
    }
    if(request.type === 'executeTask2'){
        $('a.taskSelectFunction#1').click();
    }
    if(request.type === 'executeTask3'){
        $('a.taskSelectFunction#2').click();
    }
    if(request.type === 'executeTask4'){
        $('a.taskSelectFunction#3').click();
    }
    if(request.type === 'executeTask5'){
        $('a.taskSelectFunction#settings').click();
    }
    if(request.type === 'runTask'){
        $('button#run').click();
    }
    console.log(request)
};

var handleMouseMove = function (e) {
    if (e.shiftKey) {
        // Only move bar if we aren't in the cooldown period. Note, the cooldown
        // duration should take CSS transition time into consideration.
        var timeInMs = new Date().getTime();
        if (timeInMs - gnLastMoveTimeInMs < MOVE_COOLDOWN_PERIOD_MS) {
            return;
        }
        gnLastMoveTimeInMs = timeInMs;
        // Tell content script to move iframe to a different part of the screen.
        chrome.runtime.sendMessage({type: 'moveBar'});
    }
};

var handleKeyDown = function (e) {
    var ctrlKey = e.ctrlKey || e.metaKey;
    var shiftKey = e.shiftKey;
    if (e.keyCode === X_KEYCODE && ctrlKey && shiftKey) {
        chrome.runtime.sendMessage({type: 'hideBar'});
    }
};

$gaQueryEl[gnCounter - 1].addEventListener('keyup', evaluateQuery);
$gaQueryEl[gnCounter - 1].addEventListener('mouseup', evaluateQuery);

// Add mousemove listener so we can detect Shift + mousemove inside iframe.
document.addEventListener('mousemove', handleMouseMove);
// Add keydown listener so we can detect Ctrl-Shift-X and tell the content
// script to hide iframe and steal focus.
document.addEventListener('keydown', handleKeyDown);

chrome.runtime.onMessage.addListener(handleRequest);


function saveActionData() {
    // 객체 save 로직
    //TODO save 할때 모든 Task들에 대해서 값을 다시 가져와서 저장을 하도록
    

    for (var counterId = 2; counterId<=gnCounter ; counterId++) {
        var obj = {};

        obj.selectCommand = $('select#select_command' + (counterId - 1)).val();

        if (obj.selectCommand == "Select commands") {
            alert('Select Commands !')
            return;
        }
        else if (obj.selectCommand == 'CRAWLING')//CRAWLING 선택될 경우
            obj.selectExtention = $('select#select_extention' + (counterId - 1)).val();

        obj.xPath = $('input#x_path' + (counterId - 1)).val();
        obj.inputText = $('input#input_text' + (counterId - 1)).val();

        try {
            gajTasks[gnTaskId][counterId - 2] = obj;
        }
        catch (err) {
            //초기화 안된경우에 처리해줘야한다.
            gajTasks[gnTaskId] = [];
            gajTasks[gnTaskId][gnCounter - 2] = obj;
        }
        console.log(gajTasks[gnTaskId][counterId - 2]);

    }
    console.log("save actions gajTasks ------------------- : "+gnTaskId);
    console.log(gajTasks[gnTaskId]);
    saveStorage((TASK_KEY + gnTaskId), gajTasks[gnTaskId]);
}

var addQuery = function () {

    saveActionData();//save 로직

    $gaQueryEl.push($("input.name:last")[0]);
    $gaResultsEl.push($("label.information:last")[0])

    for (var num = 0; num < $gaQueryEl.length; num++) {
        console.log($gaQueryEl[num]);
        console.log($gaResultsEl[num]);
    }

    //이벤트 리스너 추가 하는거다.
    $gaQueryEl[gnCounter - 1].addEventListener('keyup', evaluateQuery);
    $gaQueryEl[gnCounter - 1].addEventListener('mouseup', evaluateQuery);
}

var deleteQuery = function () {	//chanhee
    $gaQueryEl[gnCounter - 1].removeEventListener('keyup', evaluateQuery);
    $gaQueryEl[gnCounter - 1].removeEventListener('mouseup', evaluateQuery);

    $gaQueryEl.pop();
    $gaResultsEl.pop();
    gajTasks[gnTaskId].pop();

    saveStorage((TASK_KEY + gnTaskId), gajTasks[gnTaskId]);

    for (var num = 0; num < $gaQueryEl.length; num++) {
        console.log($gaQueryEl[num]);
        console.log($gaResultsEl[num]);
    }
}

//TODO Seongha save Chrome Storage에 저장을 한다.
$(function () {
    $('button#save').bind('click', function () {
        //TODO save 버튼을 누를시에도 저장을한다. gnTaskId 에 따라서 저장을 하면된다.
        gnCounter+=1;
        saveActionData();
        gnCounter-=1;
        
        //TODO date 저장

        //save Date to Chrome storage
        var objDate={};
        objDate[("TASK_DATE"+gnTaskId)] = $('input#schedule_date').val();

        chrome.storage.sync.set(objDate, function () {
            console.log("Date Save is suc !");
            console.log(objDate);
        });

        //save Loop Count to Chrome storage
        var objLoopCount={};
        objLoopCount[ ("TASK_LOOP_COUNT"+gnTaskId)] = $('input#loop_count').val();

        chrome.storage.sync.set(objLoopCount, function () {
            console.log("Loop Count Save is suc !");
            console.log(objLoopCount);
        });

        
    });
});

$(function () {
    $('button#left').bind('click', function () {
            chrome.runtime.sendMessage({type: 'leftMove', results: ' '});
    });
});
$(function () {
    $('button#right').bind('click', function () {
            chrome.runtime.sendMessage({type: 'rightMove', results: ' '});
    });
});


$(function () {
    $('button#run').bind('click', function () {

        //TODO last action data Save
        gnCounter += 1;//
        var command = $('select#select_command' + (gnCounter - 1)).val();
        if ("Select commands" == command) {
            //아무것도 입력안하고 전송함을 방지 한다.
            gnCounter -= 1;
            alert('Select Commands !')
            return;
        }

        saveActionData();
        gnCounter -= 1;//

        var actions = [];
        var temp = gajTasks[gnTaskId];

        console.log(temp);
        console.log(gnCounter);

        //TODO counter는 Task별로 관리를 할 필요 가 없는 것 인가??
        for (var i = 0; i < gnCounter; i++) //무조건 Counter 갯수 만큼
        {
            var obj = {};
            obj.xpath = temp[i].xPath;
            obj.command = temp[i].selectCommand;
            obj.contents = [];

            if (obj.command == "CRAWLING") {

                obj.contents.push(temp[i].selectExtention); //contents[0] : png, json, ..
                obj.contents.push(temp[i].inputText);   //contents[1] : saveAsName
                if(temp[i].selectExtention == "VIDEO"){
                    console.log("[VIDEO]")
                     obj.contents.push(temp[0].inputText)    //contents[2] : videoUrl
                }
            }
            else {
                obj.contents.push(temp[i].inputText);
            }
            console.log("proc  : " + i);
            actions.push(obj);
        }
        console.log(actions);



        var sendData ={};
        sendData.taskId = gnTaskId; //TaskId 추가
        sendData.actions = actions; //Task에 해당하는 actions 배열 전달.
        sendData.scheduleDate= $('input#schedule_date').val();

        sendData.isSchedule = $('select#is_schedule').val();

        if(sendData.isSchedule=="1" && sendData.scheduleDate ==''){
            alert("Run Fail Select Date!")
            return;
        }


        if($('input#loop_count').val() == '')
        {
            sendData.loopCount = 1;
        }
        else{
            sendData.loopCount =$('input#loop_count').val();
        }



        console.log("=============send data to server==================");
        console.log(sendData);

        alert("Run macro id <" + (gnTaskId) + ">");
        $.ajax({
            type: "POST",
            url: "http://localhost:5000/_analysis_json",
            cache: false,
            timeout: 30000,
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(sendData),
            success: function (data) {
                //TODO 0905수정
                //Data = { resultCdoe : 0 , gnTaskId : 0 } //둘다 Number
                if(data["resultCode"] == 1) {
                    alert('Task['+data["gnTaskId"]+'] Macro Success');
                }else {
                    alert('Task['+data["gnTaskId"]+'] Macro Failure');
                }

            },
            fail : function ()
            {
                alert('Network Error')
            }
        });
    });
});


(function ($, undefined) {

    $(document).bind("pagecreate", function (e) {
        $(document).on("click", "#delete", function (e) {
            console.log("delete-clicked")
            if (gnCounter > 1) {
                //UI Delete
                $("div#form" + (gnCounter)).remove();
                $("br:last").remove();
                $("button.select_logic"+gnCounter).remove();

                gnCounter--;
                deleteQuery();//Data Delete
            }else if(gnCounter == 1)
            {
                $('input#x_path1').val('');
                $('input#input_text1').val('');

                $('select#select_command1').val('Select commands').change();
                $("button.select_logic"+gnCounter).remove();//무조건 다 지운다. 빈거이기 때문
                $('select#select_extention1').val('Select Extention').change();//지우지못했어 css만 지웠음..
                $('div#div_select1').hide();
                $('label#information1').val('');
                $('input#loop_count').val('');
                $('input#schedule_date').val('');

            }

        });

        $(document).on("change", ".select-command", function (e) {

            var target = $(e.target);
            var opt = target.val();
            console.log("selected opt = " + opt);
            $("button.select_logic"+gnCounter).remove();//이전에 모든거지우고 새로추가

            if(opt == 'URL'){
                if(gURLFlag!=1)
                    chrome.runtime.sendMessage({type: 'getURL', results: ' '});
                else
                    gURLFlag=0;

            }
            if (opt == 'CRAWLING') {
                $('#div_select'+gnCounter).show();
                // var apphtml = $(
                //     "<label for='select-extention' class='select ui-hidden-accessible'>select extention</label>" +
                //
                //     '<div class="ui-select">'+
                //         "<select name='select-extention' class='select-extention' data-native-menu='true' id='select_extention" + gnCounter + "'>" +
                //         "<option value='default'>Select commands</option>" +
                //         "<option value='TXT'>TXT</option>" +
                //         "<option value='PNG'>PNG</option>" +
                //         "<option value='PICKLE'>PICKLE</option>" +
                //         "<option value='JSON'>JSON</option>" +
                //         "<option value='PDF'>PDF</option>" +
                //         "</select></div>");
                // // $(apphtml).appendTo($(e.target).parent()).parent().trigger("create");
                //
                // // console.log(($(e.target).parent()).parent());
                // $(apphtml).appendTo($('#div_select'+gnCounter));


            }

            if (opt == 'IF' || opt === 'ELSE' || opt === 'ELIF' || opt === 'FOR') {
                var apphtml;
                switch (opt) {
                    case 'IF':
                        apphtml = $("<div data-role='controlgroup ui-block-b' >" +
                            "<button type='button' data-theme='b' data-icon='arrow-r' data-mini='true' id='select_if" + gnCounter + "' class='select_logic" + gnCounter + "'>IF</button>" +
                            "</div>");
                        break;
                    case 'ELSE':
                        apphtml = $(
                            "<div data-role='controlgroup ui-block-b' >" +
                            "<button type='button' data-theme='b' data-icon='arrow-r' data-mini='true' id='select_else" + gnCounter + "' class='select_logic" + gnCounter + "'>ELSE</button>" +
                            "</div>");
                        break;
                    case 'ELIF':
                        apphtml = $(
                            "<div data-role='controlgroup ui-block-b' >" +
                            "<button type='button' data-theme='b' data-icon='arrow-r' data-mini='true' id='select_elif" + gnCounter + "' class='select_logic" + gnCounter + "'>ELIF</button>" +
                            "</div>");
                        break;
                    case 'FOR':
                        apphtml = $(
                            "<div data-role='controlgroup ui-block-b' >" +
                            "<button type='button' data-theme='b' data-icon='arrow-r' data-mini='true' id='select_for" + gnCounter + "' class='select_logic" + gnCounter + "'>FOR</button>" +
                            "</div>");
                        break;
                }

                $(apphtml).prependTo($(e.target).parent().parent().parent().parent().parent()).trigger("create");
                //$ele.attr('disabled', true); //추가된거 Disable하는 로직인가?
            }
            if (opt == 'END') {
                var $ele,
                    apphtml = $(
                        "<div data-role='controlgroup ui-block-b' >" +
                        "<button type='button' data-theme='b' data-icon='arrow-l' data-mini='true' id='select_end" + gnCounter + "' class='select_logic" + gnCounter + "'>END</button>" +
                        "</div>");

                $ele = $(apphtml).appendTo($(e.target).parent().parent().parent().parent().parent()).trigger("create");
                $ele.attr("id", "select-extention" + gnCounter);
                $ele.attr('disabled', true);
            }
        });


        $("#append", e.target).on("click", function (e) {
            console.log("append gnCounter >> " + gnCounter);

            var command = $('select#select_command' + gnCounter).val();
            if ("Select commands" == command) {
                //아무것도 입력안하고 전송함을 방지 한다.
                alert('Select Commands !')
                return;
            }


            gnCounter++;

            var group = $("#my-controlgroup");
            var addHTML = $(
                // "<form action='#' method='get'>"+
                "</br> <div class=defaultaction' id='form" + gnCounter + "' >" +
                "<div class='ui-body ui-body-a ui-corner-all action-box' data-theme='a'>" +
                "<div data-role='control group' class='action-object'>" +
                "<div data-role='ui-field-contain'>" +
                "<label for='name'>xPath:</label>" +
                "<input type='text' name='name' class='name' value='' id='x_path" + gnCounter + "'/>" +
                "</div>" +
                "<div data-role='ui-field-contain'>" +
                "<label for='inputText'>Text Input:</label>" +
                "<input type='text' name='inputText' class='inputText' value='' id='input_text" + gnCounter + "'/>" +
                "</div>" +
                "<div data-role='ui-field-contain'>" +
                "<label for='select-command' class='select ui-hidden-accessible'>Commands:</label>" +
                "<select name='select-command' class='select-command' data-native-menu='false' id='select_command" + gnCounter + "'>" +
                "<option>Select commands</option>" +
                "<option value='URL'>URL</option>" +
                "<option value='INPUT'>INPUT</option>" +
                "<option value='CLICK'>CLICK</option>" +
                "<option value='CRAWLING'>CRAWLING</option>" +
                "<option value='IF'>IF</option>" +
                "<option value='ELIF'>ELIF</option>" +
                "<option value='ELSE'>ELSE</option>" +
                "<option value='FOR'>FOR</option>" +
                "<option value='END'>END</option>" +
                "</select>" +
                "</div>" +
                "<div data-role='ui-field-contain' id='div_select"+ gnCounter + "' hidden>" +
                "<label for='select-extention' class='select ui-hidden-accessible'>Select extention</label>"+
                "<select name='select-extention' class='select-extention' id='select_extention"+ gnCounter + "'>"+
                "<option>Select Extention</option>"+
                "<option value='TXT'>TXT</option>"+
                "<option value='PNG'>PNG</option>"+
                "<option value='PICKLE'>PICKLE</option>"+
                "<option value='JSON'>JSON</option>"+
                "<option value='PDF'>PDF</option>"+
                "<option value='VIDEO'>VIDEO</option>"+
                "</select>"+
                "</div>" +
                "<div data-role='ui-field-contain ui-block-b' >" +
                "<label class='information' id='information"+ gnCounter + "'>Contents</label></div> " +
                "</div>" +
                "</div>");

            $(addHTML).appendTo($(".defaultaction:last").parent()).trigger("create");

            addQuery();

            group.controlgroup("refresh");
        });
    });
})(jQuery);

