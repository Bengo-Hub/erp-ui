// dateUtils.js

export function formatDate(date) {
    if (!(date instanceof Date)) {
        throw new Error('The input must be a Date object.');
    }

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

export function daysBetween(startDate, endDate) {
    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
        throw new Error('Both inputs must be Date objects.');
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    const differenceInMilliseconds = endDate - startDate;
    return Math.round(differenceInMilliseconds / msPerDay);
}

export function getCurrentDate() {
    const date = new Date();
    return date.toISOString().split('T')[0]; // Extracts "YYYY-MM-DD"
}

export function addDays(date, days) {
    if (!(date instanceof Date)) {
        throw new Error('The input must be a Date object.');
    }

    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
}
