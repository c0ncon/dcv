// ==UserScript==
// @name     dcv
// @version  1
// @grant    none
// @match    https://gall.dcinside.com/board/lists*
// @match    https://gall.dcinside.com/mgallery/board/lists*
// ==/UserScript==
(function (window) {
  let config = JSON.parse(localStorage.getItem('dcv')) || {
    favorites: ['kancolle']
  }
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
      }

      xmlhttp.open(method, url, true);
      xmlhttp.send();
    });
  }

  const init = () => {
    let galleryList = document.querySelector('.gall_list').cloneNode(true);
    galleryList.style.padding = '0';
    galleryTitle = document.title;
    let body = document.body;
    Object.assign(body.style, {
      width: '100%',
      height: '100%'
    });

    let galleryPaging = document.querySelector('div.bottom_paging_box').cloneNode(true);
    let gallerySearching = document.querySelector('form[name=frmSearch]').cloneNode(true);
    Object.assign(gallerySearching.style, {
      marginBottom: '50px'
    });

    let galleryTop = document.createElement('div');
    galleryTop.id = 'galleryTop';
    Object.assign(galleryTop.style, {
      display: 'flex',
      alignItems: 'center',
      height: '50px',
      position: 'fixed',
      backgroundColor: '#fff',
      top: 0,
      width: '100%',
      zIndex: 1
    });
    let hiddenForms = document.querySelector('form[name=frm]')
    galleryTop.appendChild(hiddenForms.cloneNode(true));

    let galleryButtonDiv = document.createElement('div');
    Object.assign(galleryButtonDiv.style, {
      minWidth: '100px',
      marginLeft: '5px'
    });

    let leftBox = document.querySelector('div.left_box');
    for (node of leftBox.querySelectorAll('button')) {
      let tmpNode = node.cloneNode(true);
      tmpNode.style.width = '82px'
      tmpNode.style.height = '32px'
      tmpNode.style.border = '1px solid #ccc'
      tmpNode.style.borderRadius = '2px'
      tmpNode.style.fontSize = '14px'
      tmpNode.style.fontWeight = 'bold'
      tmpNode.style.color = '#333'
      tmpNode.style.marginLeft = '5px'

      if (tmpNode.className === 'on') {
        tmpNode.style.border = '1px solid #3c4790'
        tmpNode.style.background = '#4a57a8'
        tmpNode.style.color = '#fff'
        tmpNode.style.textShadow = '0px - 1px #343d8e'
      }
      galleryButtonDiv.appendChild(tmpNode);
    }

    let centerBox = document.querySelector('div.center_box');
    if (centerBox) {
      let categoryList = document.createElement('ul');
      categoryList.style.display = 'inline';
      for (node of centerBox.querySelectorAll('a')) {
        let tmpNode = node.cloneNode(true);
        tmpNode.style.color = '#444';
        if (tmpNode.className === 'on') {
          tmpNode.style.fontWeight = 'bold'
        }

        let listItem = document.createElement('li');
        Object.assign(listItem.style, {
          display: 'inline-block',
          paddingLeft: '15px'
        });
        listItem.appendChild(tmpNode);
        categoryList.appendChild(listItem);
      }
      galleryButtonDiv.appendChild(categoryList);
    }

    // let rightBox = document.querySelector('div.right_box');
    // for (tmpNode of rightBox.children) {
    //   galleryButtonDiv.appendChild(tmpNode.cloneNode('true'));
    // }

    galleryTop.appendChild(galleryButtonDiv);

    // let searchForm = document.querySelector('#searchform');
    // galleryTop.appendChild(searchForm.cloneNode(true));

    let favoritesDiv = createFavoritesDiv();
    galleryTop.appendChild(favoritesDiv);

    let scripts = [
      'https://gall.dcinside.com/_js/comment.js',
      // 'https://gall.dcinside.com/_js/globalSearch.js'
    ];
    scripts.forEach((script) => {
      let s = document.createElement('script');
      s.src = script;
      document.head.appendChild(s);
    });
    while (body.firstChild) {
      body.removeChild(body.firstChild);
    }

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
      maxWidth: '1160px',
      margin: '25px auto',
      padding: '25px',
      overflow: 'hidden'
    });
    modalDiv.appendChild(modalInner);

    let listContainer = document.createElement('div');
    listContainer.className = 'list';
    Object.assign(listContainer.style, {
      position: 'relative',
      overflow: 'auto',
      margin: '50px auto',
      width: '100%',
      height: '100%'
    });
    listContainer.appendChild(galleryList);

    body.appendChild(galleryTop);
    body.appendChild(listContainer);
    body.appendChild(galleryPaging);
    body.appendChild(gallerySearching);
    body.appendChild(modalDiv);

    initializeListeners();
    history.pushState({}, '', location.href);
  }

  const initializeListeners = () => {
    document.querySelectorAll('table > tbody > tr > td.gall_tit > a').forEach((el) => {
      if (!el.className) {
        el.addEventListener('click', (event) => {
          event.preventDefault();
          let articleURL = event.target.href;
          Promise.all([
            openContentModal(),
            loadArticleToModal(articleURL, document.querySelector('#modalBody'))
          ]).then(() => {
            history.pushState({}, '', articleURL);
          }).catch((e) => {
            console.log(e);
            closeContentModal();
          });
        });
      }
    });

    document.addEventListener('keydown', (event) => {
      // 27 ESC
      if (event.keyCode === 27) {
        event.preventDefault();
        history.back();
      }
    });

    window.onpopstate = () => {
      closeContentModal();
      document.title = galleryTitle;
    }

    let modal = document.querySelector('#contentModal');
    modal.addEventListener('click', () => {
      history.back();
    });
    modal.childNodes.forEach((el) => el.addEventListener('click', (e) => e.stopPropagation()));

    document.querySelector('#galleryTop').addEventListener('click', (e) => {
      if (e.target && e.target.matches('span#favButton')) {
        onClickFavButton(e);
      }
    });

    document.querySelector('#modalBody').addEventListener('click', (e) => {
      if (e.target && e.target.matches('.btn_cmt_refresh')) {
        onClickReplyRefreshButton();
      }
    });
  }

  const createFavoritesDiv = () => {
    let favoritesDiv = document.createElement('div');
    favoritesDiv.id = 'favoritesDiv';
    Object.assign(favoritesDiv.style, {
      display: 'flex',
      alignItems: 'center',
      marginLeft: 'auto',
      marginRight: '5px'
    });
    let favButton = document.createElement('span');
    favButton.id = 'favButton';
    favButton.innerHTML = config.favorites.filter((fav) => fav == galleryID).length > 0 ? '-' : '+';
    Object.assign(favButton.style, {
      fontSize: '30px',
      cursor: 'pointer'
    });
    favoritesDiv.appendChild(favButton);
    favoritesDiv.innerHTML += '&nbsp;';

    let dropdown = document.createElement('select');
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
    galleryTop.removeChild(favoritesDiv);
    galleryTop.appendChild(createFavoritesDiv());
  }

  const openContentModal = () => {
    let scrollBarWidth = window.innerWidth - document.body.offsetWidth;
    Object.assign(document.body.style, {
      margin: `0px ${scrollBarWidth}px 0px 0px`,
      overflow: 'hidden'
    });

    document.querySelector('#contentModal').style.display = 'block';
  }

  const loadArticleToModal = async (url, modal) => {
    try {
      const responseText = await ajaxRequest(url);
      let template = document.createElement('template');
      template.innerHTML = responseText.trim();
      document.title = template.content.querySelector('title').innerHTML;
      template.content.querySelector('form[name=frm]').childNodes.forEach((articleHiddenForm) => {
        if (!articleHiddenForm.id)
          return;
        let t = articleHiddenForm.cloneNode(true);
        let found = false;
        let listHiddenForms = document.querySelector('form[name=frm]');
        listHiddenForms.childNodes.forEach((form) => {
          if (form.id === t.id) {
            found = true;
            listHiddenForms.replaceChild(t, form);
          }
        });
        if (!found) {
          listHiddenForms.appendChild(t);
        }
      });
      let content = document.createElement('div');
      content.className = 'view_content_wrap';
      content.appendChild(template.content.querySelector('div.gallview_head').cloneNode(true));
      let body = template.content.querySelector('div.gallview_contents').cloneNode(true);
      body.childNodes.forEach((node) => {
        if (node.className === 'sch_alliance_box' || node.className === 'power_click')
          node.remove();
      });
      content.appendChild(body);
      let commentContainer = template.content.querySelector('div.view_comment').cloneNode(true);
      commentContainer.querySelector('.cmt_write_box').remove();
      content.appendChild(commentContainer);
      let scr = document.createElement('script');
      let scrString = `
        (() => {
          viewComments(1, 'VIEW_PAGE');
        })();
      `;
      scr.innerHTML = scrString;
      content.appendChild(scr);
      modal.appendChild(document.importNode(content, true));
    }
    catch (e) {
      throw e;
    }
  }

  const closeContentModal = () => {
    if (document.querySelector('#contentModal').style.display === 'block') {
      Object.assign(document.body.style, {
        margin: '',
        overflow: ''
      });
      document.querySelector('#contentModal').style.display = 'none';
      document.querySelector('#modalBody').firstChild.remove();
    }
  }

  const onClickReplyRefreshButton = () => {
    viewComments(1, 'D', false);
  }

  init();
})(window);