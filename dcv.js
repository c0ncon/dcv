// ==UserScript==
// @name     dcv
// @version  1
// @grant    none
// @match    http://gall.dcinside.com/board/lists/*
// @match    http://gall.dcinside.com/mgallery/board/lists/*
// ==/UserScript==
(function (window) {
  const ajaxRequest = (url, method = 'GET') => {
    return new Promise((resolve, reject) => {
      let xmlhttp = new XMLHttpRequest();

      xmlhttp.onreadystatechange = () => {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {
          if (xmlhttp.status === 200) {
            resolve(xmlhttp.responseText);
          } else {
            reject(xmlhttp.statusText);
          }
        }
      };

      xmlhttp.open(method, url, true);
      xmlhttp.send();
    });
  };

  let galleryTitle = '';
  const init = () => {
    let galleryList = document.querySelector('.gallery_list');
    galleryList.style.padding = '0';
    galleryTitle = document.title;
    let body = document.body;

    let scripts = [
      "http://gall.dcinside.com/_js/ZeroClipboard.min.js",
      "http://gall.dcinside.com/_js/vr_clipboard.min.js"
    ];
    scripts.forEach((script) => {
      let s = document.createElement('script');
      s.src = script;
      document.head.appendChild(s);
    });
    while (body.firstChild) { body.removeChild(body.firstChild); }

    let modalDiv = document.createElement('div');
    modalDiv.id = 'contentModal';
    modalDiv.style.cssText = 'background-color:rgba(0,0,0,0.5);position:fixed;top:0;left:0;width:100%;height:100%;overflow:auto;display:none;padding:0 20px;z-index:2;';

    let modalInner = document.createElement('div');
    modalInner.id = 'modalBody';
    modalInner.style.cssText = 'background-color:#fff;border-radius:3px;max-width:1100px;margin:50px auto;padding:20px;overflow: auto;';

    modalDiv.appendChild(modalInner);

    let galleryTop = document.createElement('div');
    galleryList.querySelectorAll('.btn_bottom > span > a').forEach((button) => {
      let btn = button.cloneNode(true);
      btn.querySelector('img').style.padding = '5px';
      galleryTop.appendChild(btn);
    });
    body.appendChild(galleryTop);

    let galleryLeft = document.createElement('div');
    galleryLeft.id = 'dgn_gallery_left';
    galleryLeft.style.cssText = 'width:100%;height:100%;';
    galleryLeft.appendChild(galleryList);
    body.appendChild(galleryLeft);
    body.appendChild(modalDiv);

    document.querySelectorAll('table > tbody > tr > td.t_subject > a').forEach((el) => {
      if (el.className) {
        el.removeEventListener('click', openContentModal);
        el.addEventListener('click', openContentModal);
      }
    });

    document.addEventListener('keyup', (event) => {
      let modal = document.querySelector('#contentModal');
      if (event.keyCode === 27 && modal) {
        closeContentModal();
      }
    });
  };

  const openContentModal = (event) => {
    let articleURL = event.target.href;
    event.preventDefault();

    let scrollBarWidth = window.innerWidth - document.body.offsetWidth;
    document.body.style.margin = '0px ' + scrollBarWidth + 'px 0px 0px';
    document.body.style.overflow = 'hidden';

    let modal = document.querySelector('#contentModal');
    modal.addEventListener('click', () => closeContentModal());
    modal.childNodes.forEach((el) => el.addEventListener('click', (e) => e.stopPropagation()));

    loadArticleToModal(articleURL, document.querySelector('#modalBody')).then(() => {});
    modal.style.display = 'block';
    history.pushState(null, null, articleURL);
  };

  const loadArticleToModal = (url, modal) => {
    return ajaxRequest(url).then((responseText) => {
      let template = document.createElement('template');
      template.innerHTML = responseText.trim();
      document.title = template.content.querySelector('title').innerHTML;

      let content = document.createElement('div');
      content.id = 'dgn_content_de';
      content.appendChild(template.content.querySelector('.re_gall_top_1'));
      content.appendChild(template.content.querySelector('.re_gall_box_1'));
      // content.appendChild(template.content.querySelector('.re_gall_box_2'));
      template.content.querySelector('.re_gall_box_3')
        ? content.appendChild(template.content.querySelector('.re_gall_box_3'))
        : content.appendChild(document.createElement('div'));

      let replyArea = template.content.querySelector('.re_gall_box_4');
      replyArea.querySelector('.gallery_re_form').remove();
      content.appendChild(replyArea);

      let replyPerPage = document.createElement('input');
      replyPerPage.id = 'comment_num';
      replyPerPage.value = '100';
      replyPerPage.type = 'hidden';
      content.appendChild(replyPerPage);

      let replyCount = content.querySelector('#re_count').innerHTML;
      let scr = document.createElement('script');
      let scrString = `
        comment_list(${replyCount});
        var Pager = {
          pageIndexChanged: function (selectedPage) {
            _currentPage = selectedPage;
            comment_page(${replyCount});
          }
        }
      `;
      scr.innerHTML = scrString;
      content.appendChild(scr);

      modal.appendChild(document.importNode(content, true));
    }).catch((e) => console.log(e));
  };

  const closeContentModal = () => {
    document.body.style.margin = '';
    document.body.style.overflow = '';
    document.querySelector('#contentModal').style.display = 'none';

    let modalBody = document.querySelector('#modalBody');
    modalBody.removeChild(modalBody.firstChild);
    history.back();
    document.title = galleryTitle;
  };

  init();
})(window);