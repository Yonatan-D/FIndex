// 将url携带的token参数设置到Cookie
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');
  if (token) {
    const cookieValue = `x-token=${token};path=/`;
    document.cookie = cookieValue;
  }