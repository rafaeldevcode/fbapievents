class FbEventsApi {
    static setCookie(name, value, days) {
        let expires = "";

        if (days) {
            let date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }

        document.cookie = name + "=" + (value || "") + expires + "; path=/";

        return this;
    }

    static getCookie(cname) {
        let name = cname + "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let cookies = decodedCookie.split(';');
    
        for(let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i];
    
            while (cookie.charAt(0) == ' ') {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(name) == 0) {
                return cookie.substring(name.length, cookie.length);
            }
        }

        return undefined;
    }
    
    static getLocation () {
        return new Promise((resolve, reject) => {
            if (FbEventsApi.getCookie('fbuser_location') === undefined) {
                fetch('https://myip.wtf/json')
                    .then(response => response.json())
                    .then(data => {
                        FbEventsApi.setCookie('fbuser_location', JSON.stringify(data), 1);
                        resolve(JSON.stringify(data));
                    })
                    .catch(error => {
                        reject(error);
                    });
            } else {
                resolve(FbEventsApi.getCookie('fbuser_location'));
            }
        });
    }

    static getPixel () {
        const pixelParam = this.getParams('fb');

        return pixelParam;
    }

    static getParams (param) {
        const params = new URLSearchParams(window.location.search);

        return params.get(param);
    }

    static getFbc () {
        if (FbEventsApi.getCookie('_fbc') === undefined) {
            const fbc = this.getParams('fbclid');

            if (fbc) {
                setCookie('_fbc', 'fb.1.' + new Date().getTime() + '.' + fbc, 7);
            }
        }

        return FbEventsApi.getCookie('_fbc');
    }

    static getFbp () {
        if (FbEventsApi.getCookie('_fbp') === undefined) {
            const fbp = this.getParams('fbp');

            if (fbp) {
                setCookie('_fbp', fbp, 7);
            }
        }

        return FbEventsApi.getCookie('_fbp');
    }

    static getSourceUrl () {
        return `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    }

    static getUniqueEventId() {
        let eventString = Math.random().toString(36).substring(2, 15);

        return "".concat(eventString, "-").concat(this.eventTime);
    }
}