;(function(){
  modal={};
  cpgoods = {};
  cpgoods.selectedList = null;
  var modalId;
  var $modal;
  var isPoped = false;
  var urls = [];
  var pc = 0;
  var headerSelector  = ' .modal-title';
  var bodySelector    = ' .modal-body';
  var footerSelector    = ' .modal-footer';
  var progressSelector = '.progress';
  var progressbarSelector;'.progress-bar';
  var imageContainerName = 'imgContainer';
  var isDetail = false;
  var selectedImgs = [];
  var uploadedImgs = [];
  var selectedUrl;
  var resetAndAttachBody = function( options ){

    $(modalId + bodySelector).html($(options['targetId']).html());

  };
  var fileUploadReady = function(options){
    resetAndAttachBody(options);
    showNextButton('file-2',{targetId:'#mExtraInfo'},'다음');
    var ul = $('#upload ul');
    $('#drop a').click(function(){
        $(this).parent().find('input').click();
    });
    $('#upload').fileupload( fileUp(ul, function( results, error ){
      console.log(results);
      if(results){
        $.each(results.files, function( i, each_file){
          uploadedImgs.push( each_file );
          selectedImgs.push( each_file );
        });

      }else{

      }
    }) );

    $(document).on('drop dragover', function (e) {
        e.preventDefault();
    });

  }
  var setExtraInfo = function(options){
    var rt = function(data){
      return "<img src='"+data+"' width='150' height='180' style='border:1px solid #ccc;margin-right:3px'>"
    }
    var doNext = function(){
      resetAndAttachBody(options);
      var imgTags = "";
      $.each(selectedImgs, function(i, selectedImg){
        console.log(selectedImg);
        imgTags = imgTags.concat(rt(selectedImg.url));
      })
      $(modalId + bodySelector).prepend(imgTags);

      showNextButton('save',{},'저장');
    }

    hideNextButton();

    if(options && options['type']=='url'){
      var selected = $("select.image-picker").val();
      var slen  = selected.length;
      $.each(selected, function(index, value){
        $.ajax( { url : "/crawlImgs",
                  method:"POST",
                  data: {
                          url:value
                        }
        } ).done(function(data){
          selectedImgs.push(JSON.parse(data)["files"][0]);
          slen--;
          if(slen == 0){
            doNext();
          }
        });
      });
    }else{
      doNext();
    }
  }
  var saveandclose = function(options){
    hideNextButton();
    var fCon = $("textarea#freecontent").val();
    var fTag = $("input#tags").val();
    $.ajax( { url : "/save",
              method:"POST",
              data: {
                      url:selectedUrl
                      , imgs:selectedImgs
                      , content:fCon
                      , tags: fTag
                      , user : { username: 'keen', id:'1qaz2wsx'}
                    }
    } ).done(function(data){
      $( modalId ).modal('toggle');
      resetModal();
      location.href="/list/keen";
    });
  }
  var steps = {
    "intro" : { title : "upload 방법을 선택하세요",
                bodycallback : resetAndAttachBody
              },
    "url-1" : { title : "url 을 복사해서 붙여넣기",
                bodycallback : resetAndAttachBody
              },
    "url-2" : { title : "이미지 선택하기",
                bodycallback : modal.searchImage
              },
    "url-3" : { title : "내용 입력하기",
                bodycallback : setExtraInfo
              },
    "save" : { title : "저장중",
                bodycallback : saveandclose
              },
    "file-1" : { title : "file을 드래그해서 놓기",
                bodycallback : fileUploadReady
              },
    "file-2" : { title : "내용 입력하기",
                bodycallback : setExtraInfo
              }
  };

  var intro = function( tid, tBody, sBody ){
    $(tid).modal();
    targets[tid];
    $(tBody).prepend();
  };
  modal.getUploadedImgs = function(){
    return uploadedImgs;
  }
  modal.searchImage = function( option ){

    $("."+imageContainerName).remove();
    selectedUrl = option.url;
    var time = option.time ||500;
    pc = 1;
    progressUpdate();
    toggleVisual( progressSelector, "on" );
    if(isDetail){
        time = 2000;
        $.get("/imgurl-detail/?url="+selectedUrl, function(data){
          progressUpdate();
          var html = getHtmlFromImgJson(data);
          appendDocByHtml( modalId + bodySelector, html );
          var dd =$("select");

          $("select").imagepicker({
            hide_select : true,
            show_label  : false
          });
          pc=100;
          resetProgress();
          showNextButton('url-3',{targetId:"#mExtraInfo", type:'url'},'다음');
        });
    }else{

        $.get("/imgurl/?url="+selectedUrl, function(data){
          progressUpdate();
          var html = getHtmlFromImgJson(data);
          appendDocByHtml( modalId + bodySelector, html );
          var dd = $("select");

          $("select").imagepicker({
            hide_select : true,
            show_label  : false
          })
          pc=100;
          resetProgress();
          showNextButton('url-3',{targetId:"#mExtraInfo", type:'url'},'다음');
        });
    }
    var intId = setInterval(function(){
      progressUpdate();
      if(pc>=100){
        clearInterval( intId );
      }else{
        pc+=3;
      }
    }, time);

  };
  var showNextButton = function(step, option, msg){
    var optionStr = JSON.stringify(option);
    $(modalId + footerSelector).prepend("<button id='Next1' class='btn btn-small btn-primary nextStep' onclick='modal.goStep(\""+step+"\","+optionStr+");'>"+msg+"</button>");
  }
  var hideNextButton = function(){
    $('.nextStep').remove()
  }
  var progressUpdate = function(){
    $( progressbarSelector ).css('width',pc+'%');
    $( progressbarSelector ).html(pc+'%');
  }
  var toggleVisual = function( selector , cmd ){

    if(cmd == "on"){
      $(selector).removeClass('hidden');
      $(selector).addClass('show');
    }else{
      $(selector).removeClass('show');
      $(selector).addClass('hidden');
    }
  }
  var updateDocByIds = function( hid, sid ){
    $(hid).html($(sid).html());
  }
  var updateDocByHtml = function( hid, html ){
    $(hid).html(html);
  }
  var appendDocByHtml = function( hid, html){
    $(hid).append(html);
  }

  var getHtmlFromImgJson = function( imgJson ){
    var imgs=imgJson;
    if(typeof imgJson !== "object" )
      imgs = $.parseJSON( imgJson );
    var len = imgs.length,i=0;
    var html = "<div class='container-fluid "+imageContainerName+"'>";
    html = html.concat("<select multiple='multiple' class='image-picker'>");
    while(i<len){
      var img = imgs[i];
      if($.inArray(img,urls) == -1){
        html = html.concat("<option data-img-src='"+img+"' value='"+img+"'>"+img+"</option>");
        urls.push( img );
      }
      i++;
    }
    html = html.concat("</select>");
    return html+"</div>";
  }
  var resetProgress = function(){
    pc=0;
    progressUpdate( pc );
    urls = [];
    selectedImgs = [];
    toggleVisual(progressSelector,"off");
  }
  var resetModal = function(tBody){
    resetProgress();
    uploadedImgs = [];
    selectedUrl = undefined;
    $(modalId + bodySelector).html('');
  }
  modal.init = function(option){
    if(option){
      if(option && option.modalId) modalId = option.modalId;
      if(option && option.pgbarSelector)progressbarSelector = option.pgbarSelector;
      if(option && option.pgSelector)progressSelector = option.pgSelector;
    }
    $(modalId).on('shown.bs.modal', function(){
      isPoped = true;
    });
    $(modalId).on('hidden.bs.modal', function(){
      isPoped = false;
      resetModal();
    });

  };

  modal.goStep = function( step, options ){

    if(!isPoped) $(modalId).modal();
    var title = steps[step]['title'];
    $( modalId + headerSelector ).html(title);
    steps[step]['bodycallback']( options );

  };
  modal.setDetailSearch = function(value){
    isDetail = value;
  }
  cpgoods.selectArticleByUser = function( username, callback ){
    $.ajax({ url : "/getAtricles/" + username,
              method:"GET"
    } ).done(function(data){
      cpgoods.selectedList = data;
      callback(data);
    });
  }
  cpgoods.getGoodiesObj = function( f_token ){
    var sLen = -1;
    if(cpgoods.selectedList && (sLen = cpgoods.selectedList.length)>0){
      for(var i=0;i<sLen;i++){
        if(cpgoods.selectedList[i] &&
          cpgoods.selectedList[i]["value"] &&
          cpgoods.selectedList[i]["value"]["imgs"] &&
          cpgoods.selectedList[i]["value"]["imgs"][0] &&
          cpgoods.selectedList[i]["value"]["imgs"][0]["filetoken"] == f_token)
          return cpgoods.selectedList[i]["value"];
      }
    }else{
      return null;
    }
  }
  cpgoods.compare = function(){
    var goodiesId = '#cpgoods';
    var goodies_body = '#mCpgoods>.modal-dialog>.modal-content>.modal-body>#goodies_comp_body';

    var goodies_arr = $( goodiesId ).val();
    var goodstring = goodies_arr.join();
    $("#mCpgoods").modal();
    $('#mCpgoods').on('hidden.bs.modal', function (e) {
      $(goodies_body+">ul").empty();
      $(goodies_body+">.tab-content").empty();
    })
    var ul_tag = $(goodies_body+">ul");
    var content_tag = $(goodies_body+">.tab-content");
    cpgoods.getCompareGoodies(goodstring, function( cp_url ){
      var cp_comment_tag = cp_url + '<br><p><textarea style=\'width:100%;\' rows=\'7\' name=\'compare_comment\'></textarea><br>';
      $(goodies_body+">ul").append('<li class="active"><a href="#tab0" role="tab" data-toggle="tab">summary</a></li>');
      $(goodies_body+">.tab-content").append('<div class="tab-pane active" id="tab0">' + cp_comment_tag +'</div>');

      for(var i=0,len=goodies_arr.length;i<len;i++){
        var goodies = cpgoods.getGoodiesObj(goodies_arr[i]);
        $(goodies_body+">ul").append('<li><a href="#tab'+(i+1)+'" role="tab" data-toggle="tab">'+(i+1)+'번</a></li>');

        var tab_content = '<img src=\"'+goodies['imgs'][0]['url']+'\"><br>'+goodies['content'];
        $(goodies_body+">.tab-content").append('<div class="tab-pane" id="tab'+(i+1)+'">'+tab_content+'</div>');
      }
      $('#goodies_tab').tab('show');
    });

  }
  cpgoods.getCompareGoodies = function( goodstring, callback ){
    $.ajax( { url : "/comparegoodies",
              method:"POST",
              data: {
                      goodstring :goodstring
                      , user : { username: 'keen', id:'1qaz2wsx'}
                    }
    } ).done(function(data){
      if(typeof(data)==="string"){
        callback('<img style=\'width:100%\' src=\''+data+'\'>');
      }
    });
  }
})();
