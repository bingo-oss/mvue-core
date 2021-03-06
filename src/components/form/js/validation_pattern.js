export default [
    {
        type:"email",
        brief:"邮件",
        pattern:"^[a-zA-Z0-9_\\.\\-]+\\@([a-zA-Z0-9\\-]+\\.)+[a-zA-Z0-9]{2,4}$"
    },
    {
        type:"url",
        brief:"网址",
        pattern:"^(http|https|ftp):\\/\\/(([a-zA-Z0-9][a-zA-Z0-9_-]*)(\\.[a-zA-Z0-9][a-zA-Z0-9_-]*)+)(:(\\d+))?\\/?"
    },
    {
        type:"mobile",
        brief:"手机号",
        pattern:"^1[3|4|5|7|8]\\d{9}$"
    },
    {
        type:"regex",
        brief:"自定义",
        pattern:""
    }
];