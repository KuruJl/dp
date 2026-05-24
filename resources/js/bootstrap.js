import axios from 'axios';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;

const csrfMeta = document.head.querySelector('meta[name="csrf-token"]');
if (csrfMeta) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfMeta.content;
}

const xsrfCookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='));

if (xsrfCookie) {
    const token = decodeURIComponent(xsrfCookie.split('=').slice(1).join('='));
    window.axios.defaults.headers.common['X-XSRF-TOKEN'] = token;
}
