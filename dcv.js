// ==UserScript==
// @name     dcv
// @version  1
// @grant    none
// @match    http://gall.dcinside.com/board/lists/*
// @match    http://gall.dcinside.com/mgallery/board/lists/*
// ==/UserScript==
(function (window) {
  let config = JSON.parse(localStorage.getItem('dcv')) || {
    favorites: ['kancolle']
  };
  let galleryID = (new URL(location.href)).searchParams.get('id');
  let galleryTitle = '';

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

  const init = () => {
    let galleryList = document.querySelector('.gallery_list');
    galleryList.style.padding = '0';
    galleryTitle = document.title;
    let body = document.body;
    Object.assign(body.style, {
      width: '100%',
      height: '100%'
    });

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
    Object.assign(modalDiv.style, {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'auto',
      margin: '50px auto',
      display: 'none'
    });

    let modalInner = document.createElement('div');
    modalInner.id = 'modalBody';
    Object.assign(modalInner.style, {
      backgroundColor: '#fff',
      borderRadius: '3px',
      maxWidth: '1100px',
      margin: '25px auto',
      padding: '25px',
      overflow: 'hidden'
    });

    modalDiv.appendChild(modalInner);

    let galleryTop = document.createElement('div');
    galleryTop.id = 'galleryTop';
    Object.assign(galleryTop.style, {
      height: '50px',
      position: 'fixed',
      backgroundColor: '#fff',
      top: 0,
      left: 0,
      width: '100%',
      zIndex: 1
    });
    let galleryButtonDiv = document.createElement('div');
    Object.assign(galleryButtonDiv.style, {
      float: 'left',
      position: 'absolute',
      top: '50%',
      transform: 'translate(0, -50%)'
    });
    galleryList.querySelectorAll('.btn_bottom > span > a').forEach((button) => {
      let btn = button.cloneNode(true);
      btn.querySelector('img').style.margin = '5px';
      galleryButtonDiv.appendChild(btn);
    });
    galleryTop.appendChild(galleryButtonDiv);

    let favoritesDiv = getFavoritesDiv();
    galleryTop.appendChild(favoritesDiv);

    body.appendChild(galleryTop);

    let galleryLeft = document.createElement('div');
    galleryLeft.id = 'dgn_gallery_left';
    Object.assign(galleryLeft.style, {
      position: 'relative',
      overflow: 'auto',
      margin: '50px auto',
      width: '100%',
      height: '100%'
    });
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

  const getFavoritesDiv = () => {
    let favoritesDiv = document.createElement('div');
    favoritesDiv.id = 'favoritesDiv';
    Object.assign(favoritesDiv.style, {
      float: 'right',
      position: 'relative',
      top: '50%',
      right: 0,
      transform: 'translate(0, -50%)'
    });
    let favButton = document.createElement('span');
    favButton.id = 'favButton';
    favButton.innerHTML = config.favorites.filter((fav) => fav == galleryID).length > 0 ? '-' : '+';
    Object.assign(favButton.style, {
      fontSize: '30px'
    });
    favButton.addEventListener('click', onClickFavButton);
    favoritesDiv.appendChild(favButton);

    let dropdown = document.createElement('select');
    Object.assign(dropdown.style, {
      margin: '5px',
      float: 'right'
    });
    let placeholderOption = document.createElement('option');
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    placeholderOption.hidden = true;
    placeholderOption.innerHTML = 'Favorites';
    dropdown.appendChild(placeholderOption);
    config.favorites.forEach((fav) => {
      let el = document.createElement('option');
      el.innerHTML = fav;
      el.value = fav;
      dropdown.appendChild(el);
    });
    dropdown.onchange = (e) => {
      window.location.replace(`http://gall.dcinside.com/${e.target.value}`);
    }
    favoritesDiv.appendChild(dropdown);
    
    return favoritesDiv;
  }

  const onClickFavButton = (event) => {
    event.preventDefault();
    if (config.favorites.filter((fav) => fav == galleryID).length > 0)
      config.favorites = config.favorites.filter((fav) => fav !== galleryID);
    else
      config.favorites = config.favorites.concat(galleryID);

    config.favorites = config.favorites.sort();
    localStorage.setItem('dcv', JSON.stringify(config));

    let galleryTop = document.querySelector('#galleryTop');
    let favoritesDiv = document.querySelector('#favoritesDiv');
    document.querySelector('#favButton').removeEventListener('click', onClickFavButton);
    galleryTop.removeChild(favoritesDiv);
    galleryTop.appendChild(getFavoritesDiv());
  }

  const openContentModal = (event) => {
    let articleURL = event.target.href;
    event.preventDefault();

    let scrollBarWidth = window.innerWidth - document.body.offsetWidth;
    Object.assign(document.body.style, {
      margin: `0px ${scrollBarWidth}px 0px 0px`,
      overflow: 'hidden'
    });

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
    Object.assign(document.body.style, {
      margin: '',
      overflow: ''
    });
    document.querySelector('#contentModal').style.display = 'none';

    let modalBody = document.querySelector('#modalBody');
    modalBody.removeChild(modalBody.firstChild);
    history.back();
    document.title = galleryTitle;
  };

  init();
})(window);