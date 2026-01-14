class ContextMenu extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.init();
  }

  init() {
    const slot = document.createElement('slot');
    this.shadow.appendChild(slot);
    // 添加右键菜单
    this.contextMenu = this.createContextMenu();
  }

  createContextMenu() {
    const contextMenu = document.createElement('div');
    contextMenu.id = 'contextMenu';
    contextMenu.innerHTML = `
      <style>
        #contextMenu {
          display: none;
          position: absolute;
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        #contextMenu ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        #contextMenu li {
          padding: 8px 16px;
          cursor: pointer;
        }
        #contextMenu li:hover {
          background-color: #f0f0f0;
        }
      </style>
      <ul>
        <li>预览</li>
        <li>复制链接</li>
        <li>下载</li>
      </ul>
    `;
    this.shadow.appendChild(contextMenu);
    const menuItems = this.shadowRoot.querySelectorAll('#contextMenu li');
    menuItems.forEach((item) => {
      item.addEventListener('click', this.handleMenuItemClick.bind(contextMenu, item.textContent));
    });
    return contextMenu;
  }

  handleContextMenu(event) {
    event.preventDefault();
    const link = event.target.closest('a');
    if (!link) {
      this.closeContextMenu();
      return;
    }
    if (link.firstElementChild.textContent === '..')
      return;
    const { pageX, pageY } = event;
    Object.assign(this.contextMenu.style, {
      display: 'block',
      left: `${pageX}px`,
      top: `${pageY}px`
    });
    this.contextMenu.setAttribute('data-file', link.getAttribute('href'));
  }

  closeContextMenu() {
    this.contextMenu.style.display = 'none';
  }

  closeContextMenuOnClickOutside(event) {
    if (!this.contains(event.target)) {
      this.closeContextMenu();
    }
  }

  handleMenuItemClick(type) {
    const fileUrl = decodeURIComponent(this.getAttribute('data-file'));
    const fileName = fileUrl.slice(fileUrl.lastIndexOf('/') + 1);

    switch (type) {
      case '预览':
        alert('🚧施工中');
        break;
      case '复制链接':
        navigator.clipboard.writeText(`${window.location.href}${fileUrl}?download`)
        .then(() => {
          console.log('复制成功！');
        })
        .catch(err => {
          console.error('复制失败：', err);
        });
        break;
      case '下载':
        const link = document.createElement('a');
        link.href = `${fileUrl}?download`;
        link.download = fileName;
        link.click();
        break;
      default:
        window.open(fileUrl);
        break;
    }
  }

  connectedCallback() {
    this.shadow.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    this.shadow.addEventListener('click', this.closeContextMenu.bind(this));
    document.addEventListener('contextmenu', this.closeContextMenuOnClickOutside.bind(this));
    document.addEventListener('click', this.closeContextMenuOnClickOutside.bind(this));
  }

  disconnectedCallback() {
    this.shadow.removeEventListener('contextmenu', this.handleContextMenu.bind(this));
    this.shadow.removeEventListener('click', this.closeContextMenu.bind(this));
    document.removeEventListener('contextmenu', this.closeContextMenuOnClickOutside.bind(this));
    document.removeEventListener('click', this.closeContextMenuOnClickOutside.bind(this));
  }
  
}

customElements.define('content-menu', ContextMenu);
