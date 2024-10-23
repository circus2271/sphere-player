// use this code only for "/" root url:
// play.sphere.care and not play.sphere.care/images... and so on
import { next } from "@vercel/edge";
import { parse } from 'node-html-parser';

export const config = {
    matcher: '/',
};


const getModifiedHTML = async (language, pageUrl) => {
    let modifiedHTML;
    try {

        // const page = await fetch('/')
        // const page = await fetch('/index.html')
        // const page = await fetch('https://test1.sphere.care')
        const page = await fetch(pageUrl)
        const rawHTML = await page.text()
        const parsed = parse(rawHTML)
        const body = parsed.querySelector('body')
        // body.classList.add(language + new Date().getTime())

        // clean up
        body.classList.remove('ru')
        body.classList.remove('en')

        // set preferred language
        body.classList.add(language)


        modifiedHTML = parsed.toString()
    } catch (error) {
        console.log(error)
    }

    return modifiedHTML
}
export default async function middleware(request, context) {
    console.log('ww')
    // const acceptLanguage = request.headers['accept-language'];
    const acceptLanguage = request.headers.get('accept-language');

    // if user's browser didn't send 'accept-language' header, then do nothing
    // it will eventually fallback to a language specified on html <body> tag: for example: <body class="en"> or <body class="ru">
    if (!acceptLanguage) return next()

    // Determine the user's preferred language
    const languages = acceptLanguage.split(',');
    const preferredLanguage = languages[0];
    const language = preferredLanguage.startsWith('ru') ? 'ru' : 'en'

    let modifiedHTML = await getModifiedHTML(language, request.url);

    // context.waitUntil(getModifiedHTML(language).then(html => modifiedHTML = html))

    return new Response(modifiedHTML, {status: 200, statusText: 'great', headers: {'Content-Type': 'text/html; charset=utf-8'}})


    // let message;
    // if (userLanguage.startsWith('en')) {
    //     message = "User has the English version."
    // } else if (userLanguage.startsWith('ru')) {
    //     message ="User has the Russian version."
    // } else {
    //     message = "User has a different language version: " + userLanguage
    // }


    // return new Response(message, {status: 200, statusText: 'great'})
}