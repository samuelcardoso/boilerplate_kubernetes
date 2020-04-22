'use strict';
import { Errors } from 'typescript-rest';
const sanitizeHtml = require('sanitize-html');

export class ValidatorUtils {

    public static clearInvalidCodeForHtml(html: string): string {
        const newHTML: string = sanitizeHtml(html, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(
                [
                    'a',
                    'img',
                    'h1',
                    'h2',
                    'h3',
                    'h4',
                    'h5',
                    'h6',
                    'td',
                    'tr',
                    'strong',
                    'ol',
                    'li',
                    'ul',
                    'p',
                    'table',
                    'tbody',
                    'div',
                    'span',
                    'iframe'
                ]),
            allowedAttributes: {
                a:      [ 'class', 'style', 'href', 'name', 'target' ],
                img:    [ 'class', 'style', 'src', 'alt', 'width', 'height' ],
                h1:     [ 'class', 'style' ],
                h2:     [ 'class', 'style' ],
                h3:     [ 'class', 'style' ],
                h4:     [ 'class', 'style' ],
                h5:     [ 'class', 'style' ],
                h6:     [ 'class', 'style' ],
                td:     ['class', 'style', 'colspan', 'rowspan', 'valign', 'align'],
                tr:     ['class', 'style', 'colspan', 'rowspan', 'valign', 'align'],
                strong: [ 'class', 'style' ],
                ol:     [ 'class', 'style' ],
                li:     [ 'class', 'style' ],
                ul:     [ 'class', 'style' ],
                p:      [ 'class', 'style' ],
                table:  [ 'class', 'style' ],
                tbody:  [ 'class', 'style' ],
                div:    [ 'class', 'style' ],
                span:   [ 'class', 'style' ],
                iframe: [ 'src', 'width', 'height', 'allowfullscreen', 'frameborder' ]
              }
        });

        const youTubeIframeIndex = newHTML.indexOf('iframe');
        const youTubeSrcHTTP = 'iframe src="http://www.youtube.com/embed';
        const youTubeSrcHTTPS = 'iframe src="https://www.youtube.com/embed';
        const youTubeShortSrcHTTP = 'iframe src="http://y2u.be/';
        const youTubeShortSrcHTTPS = 'iframe src="https://y2u.be/';
        const youTubeShortBeSrcHTTP = 'iframe src="http://youtu.be/';
        const youTubeShortBeSrcHTTPS = 'iframe src="https://youtu.be/';

        const iframeSrcHTTP = newHTML.substring(
            youTubeIframeIndex,
            youTubeIframeIndex + youTubeSrcHTTP.length);
        const iframeSrcHTTPS = newHTML.substring(
            youTubeIframeIndex,
            youTubeIframeIndex + youTubeSrcHTTPS.length);

        if(
            (youTubeIframeIndex >= 1) &&
                !(
                    iframeSrcHTTP === youTubeSrcHTTP || iframeSrcHTTPS === youTubeSrcHTTPS
                ||
                    iframeSrcHTTP === youTubeShortSrcHTTP || iframeSrcHTTPS === youTubeShortSrcHTTPS
                ||
                    iframeSrcHTTP === youTubeShortBeSrcHTTP || iframeSrcHTTPS === youTubeShortBeSrcHTTPS)
        ) {
            throw new Errors.UnauthorizedError('Invalid HTML code');
        }
        return newHTML;
    }

    public static testCPF(strCPF: string) {
        let Soma;
        let Resto;
        Soma = 0;
        if (strCPF === '00000000000') {
            return false;
        }

        for (let i=1; i<=9; i++) {
            Soma = Soma + parseInt(strCPF.substring(i-1, i), 10) * (11 - i);
        }

        Resto = (Soma * 10) % 11;

        if ((Resto === 10) || (Resto === 11))  {
            Resto = 0;
        }

        if (Resto !== parseInt(strCPF.substring(9, 10), 10) ) {
            return false;
        }

        Soma = 0;

        for (let i = 1; i <= 10; i++) {
            Soma = Soma + parseInt(strCPF.substring(i-1, i), 10) * (12 - i);
        }

        Resto = (Soma * 10) % 11;

        if ((Resto === 10) || (Resto === 11)) {
            Resto = 0;
        }

        if (Resto !== parseInt(strCPF.substring(10, 11), 10) ) {
            return false;
        }

        return true;
    }
}
