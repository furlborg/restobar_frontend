export function toTimestamp(strDate) {
    return new Date(strDate).getTime()
}

export function calcAge(dateString) {
    let birthday = +new Date(dateString);
    return ~~((Date.now() - birthday) / (31557600000));
}

export function toDate(timestamp) {
    let date = new Date(timestamp)
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
}