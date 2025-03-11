'use strict';

class FbEventsApi {
    constructor (pixelDefault , events = []) {
        this.pixel = this.getPixel(pixelDefault);
        this.events = Array.isArray(events) ? events : [events];
        this.eventTime = Math.floor(Date.now() / 1e3) - 60;
        this.id = this.getUniqueEventId();
        this.external_id = null;
        this.order_id = null;
        
        eval("!function(f,b,e,v,n,t,s) {if(f.fbq)return;n=f.fbq=function(){n.callMethod? n.callMethod.apply(n,arguments):n.queue.push(arguments)}; if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0'; n.queue=[];t=b.createElement(e);t.async=!0; t.src=v;s=b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t,s)}(window, document,'script', 'https://connect.facebook.net/en_US/fbevents.js');");
    }

    init () {
        if (this.pixel !== null) {
            const userData = this.getUserData(true);

            fbq('init', this.pixel);

            this.events.forEach((event) => {
                this.track(event, userData);
            });
        }

        return this;
    }

    track (event, data = undefined) {
        if (this.pixel !== null) {
            if (typeof event === 'function') {
                event();
            } else {
                if (data !== undefined) {
                    fbq('track', event, data);
                } else {
                    fbq('track', event);
                }
            }
        }

        return this;
    }

    encrypt (value) {
        return CryptoJS.SHA256(value).toString();
    }

    setLocation () {
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

    setExternalId (id) {
        this.external_id = id;
        return this;
    }

    setOrderId (id) {
        this.order_id = id;
        return this;
    }

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

    static deleteCookie(name) {
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    
    getUser () {
        if (FbEventsApi.getCookie('fbuser_data') === undefined) {
            let ge = this.getGender();
            let names = this.getName();
            let em = this.getEmail();
            let ph = this.getPhone();
            let data = {};

            if (ge) Object.assign(data, { gender: ge });
            if (em) Object.assign(data, { email: em });
            if (ph) Object.assign(data, { phone: ph });
            if (names && names.fn) Object.assign(data, { first_name: names.fn });
            if (names && names.ln) Object.assign(data, { last_name: names.ln });
            

            FbEventsApi.setCookie('fbuser_data', JSON.stringify(data), 365);

            return data;
        } else {
            return JSON.parse(FbEventsApi.getCookie('fbuser_data'))
        }
    }

    getPixel (pixelDefault) {
        const pixelParam = this.getParams('fb');

        return pixelParam === null ? pixelDefault : pixelParam;
    }

    getUserData (encrypt = false) {
        let data = {};
        let fbp = this.getFbp();
        let fbc = this.getFbc();
        let sourceUrl = this.getSourceUrl();
        let ipLocation = JSON.parse(FbEventsApi.getCookie('fbuser_location'));
        let user = this.getUser();
        
        if (this.external_id) {
            data.external_id = this.id;
        }

        if (this.order_id) {
            data.order_id = this.id;
        }

        if (user.first_name) {
            data.fn = encrypt ? this.encrypt(user.first_name.toLowerCase()) : user.first_name;
        }

        if (user.last_name) {
            data.ln = encrypt ? this.encrypt(user.last_name.toLowerCase()) : user.last_name;
        }

        if (user.email) {
            data.em = encrypt ? this.encrypt(user.email) : user.email;
        }

        if (user.gender) {
            data.ge = encrypt ? this.encrypt(user.gender) : user.gender;
        }

        if (user.phone) {
            data.ph = encrypt ? this.encrypt(user.phone) : user.phone;
        }

        if (ipLocation.YourFuckingIPAddress) {
            data.client_ip_address = encrypt ? this.encrypt(ipLocation.YourFuckingIPAddress) : ipLocation.YourFuckingIPAddress;
        }

        if (ipLocation.YourFuckingCity) {
            data.ct = encrypt ? this.encrypt(ipLocation.YourFuckingCity.toLowerCase()) : ipLocation.YourFuckingCity;
            data.city = encrypt ? this.encrypt(ipLocation.YourFuckingCity.toLowerCase()) : ipLocation.YourFuckingCity;
        }

        if (ipLocation.YourFuckingLocation) {
            data.st = encrypt ? this.encrypt(ipLocation.YourFuckingLocation.toLowerCase().split(', ')[1]) : ipLocation.YourFuckingLocation.split(', ')[1];
        }

        if (ipLocation.YourFuckingCountryCode) {
            data.country = encrypt ? this.encrypt(ipLocation.YourFuckingCountryCode.toLowerCase()) : ipLocation.YourFuckingCountryCode;
        }

        if (sourceUrl) {
            data.event_source_url = sourceUrl;
        }

        if (fbp !== undefined) {
            data.fbp = fbp;
        }

        if (fbc !== undefined) {
            data.fbc = fbc;
        }

        return data;
    }

    getEventData (eventName) {
        return {
            eventID: this.id,
            eventName: eventName,
            eventTime: this.eventTime
        };
    }

    getParams (param) {
        const params = new URLSearchParams(window.location.search);

        return params.get(param);
    }

    getFbc () {
        if (FbEventsApi.getCookie('_fbc') === undefined) {
            const fbc = this.getParams('fbclid');

            if (fbc) {
                setCookie('_fbc', 'fb.1.' + new Date().getTime() + '.' + fbc, 7);
            }
        }

        return FbEventsApi.getCookie('_fbc');
    }

    getFbp () {
        if (FbEventsApi.getCookie('_fbp') === undefined) {
            const fbp = this.getParams('fbp');

            if (fbp) {
                setCookie('_fbp', fbp, 7);
            }
        }

        return FbEventsApi.getCookie('_fbp');
    }

    getSourceUrl () {
        return `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    }

    getUniqueEventId() {
        let eventString = Math.random().toString(36).substring(2, 15);

        return "".concat(eventString, "-").concat(this.eventTime);
    }

    getEmail() {
        return FbEventsApi.getCookie('lead::email');
    }

    getGender() {
        const genders = ["f", "m"];
        const genderPos = genders.length;

        return genders[parseInt(Math.random() * genderPos)];
    }

    getPhone () {
        return FbEventsApi.getCookie('lead::phone');
    }

    getName() {
        const name = FbEventsApi.getCookie('lead::name');
        const names = name ? name.split(' ') : [];
        const fn = names && names[0] ? names[0] : null;
        const ln = names && names[1] ? names.slice(1).join(' ') || null : null;
    
        return {
            fn: fn,
            ln: ln
        };
    }
    
}