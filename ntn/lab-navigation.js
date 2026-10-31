(() => {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'NTN 网站导航');
  nav.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:9999;display:flex;gap:0;align-items:center;background:#173344;color:#fff;border:1px solid #ffffff26;border-radius:9px;box-shadow:0 3px 18px #0002;font:12px/1.5 system-ui,sans-serif;overflow:hidden';
  for (const [label, href] of [['← NTN 目录', 'index.html'], ['个人主页 ↗', '/']]) {
    const link = document.createElement('a');
    link.textContent = label;
    link.href = href;
    link.style.cssText = 'display:block;padding:9px 12px;color:inherit;text-decoration:none;white-space:nowrap';
    nav.appendChild(link);
  }
  document.body.appendChild(nav);
})();
