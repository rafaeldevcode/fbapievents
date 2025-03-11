'use strict';

class FbEventsApi {
    constructor (pixelDefault , events = []) {
        this.pixel = this.getPixel(pixelDefault);
        this.events = Array.isArray(events) ? events : [events];
        this.eventTime = Math.floor(Date.now() / 1e3) - 60;
        this.id = this.getUniqueEventId();
        
        eval("!function(f,b,e,v,n,t,s) {if(f.fbq)return;n=f.fbq=function(){n.callMethod? n.callMethod.apply(n,arguments):n.queue.push(arguments)}; if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0'; n.queue=[];t=b.createElement(e);t.async=!0; t.src=v;s=b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t,s)}(window, document,'script', 'https://connect.facebook.net/en_US/fbevents.js');");
    }

    init () {
        if (this.pixel !== null) {
            fbq('init', this.pixel);

            this.events.forEach((event) => {
                this.track(event);
            });
        }

        return this;
    }

    track (event, data = undefined) {
        if (this.pixel !== null) {
            if (typeof event === 'function') {
                event();
            } else {
                const userData = this.getUserData();
                const eventData = this.getEventData(event);
    
                if (data !== undefined) {
                    Object.keys(data).forEach((key) => {
                        userData[key] = data[key];
                    });
                }
    
                fbq('trackSingle', this.pixel, event, userData, eventData);
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

    getUser (countryCode) {
        if (FbEventsApi.getCookie('fbuser_data') === undefined) {
            let ge = this.getGender();
            let names = this.getName(countryCode, ge);
            let em = this.getEmail(names.fn.toLowerCase() + names.ln.toLowerCase());
            let ph = this.getPhone(countryCode);
            let data = {
                first_name: names.fn,
                last_name: names.ln,
                email: em,
                gender: ge,
                phone: ph
            };

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

    getUserData () {
        let data = {};
        let fbp = this.getFbp();
        let fbc = this.getFbc();
        let sourceUrl = this.getSourceUrl();
        let ipLocation = JSON.parse(FbEventsApi.getCookie('fbuser_location'));
        let user = this.getUser(ipLocation.YourFuckingCountryCode);
        
        if (this.id) {
            data.external_id = this.id;
            data.order_id = this.id;
        }

        if (user.first_name) {
            data.fn = this.encrypt(user.first_name.toLowerCase());
        }

        if (user.last_name) {
            data.ln = this.encrypt(user.last_name.toLowerCase());
        }

        if (user.email) {
            data.em = this.encrypt(user.email);
        }

        if (user.gender) {
            data.ge = this.encrypt(user.gender);
        }

        if (user.phone) {
            data.ph = this.encrypt(user.phone);
        }

        if (ipLocation.YourFuckingIPAddress) {
            data.client_ip_address = this.encrypt(ipLocation.YourFuckingIPAddress);
        }

        if (ipLocation.YourFuckingCity) {
            data.ct = this.encrypt(ipLocation.YourFuckingCity.toLowerCase());
            data.city = this.encrypt(ipLocation.YourFuckingCity.toLowerCase());
        }

        if (ipLocation.YourFuckingLocation) {
            data.st = this.encrypt(ipLocation.YourFuckingLocation.toLowerCase().split(', ')[1]);
        }

        if (ipLocation.YourFuckingCountryCode) {
            data.country = this.encrypt(ipLocation.YourFuckingCountryCode.toLowerCase());
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

    getEmail(name) {
        const hosts = ["gmail.com", "hotmail.com", "yahoo.com", "outlook.com"];
        const hostPos = hosts.length;

        return `${name}@${hosts[parseInt(Math.random() * hostPos)]}`;
    }

    getGender() {
        const genders = ["f", "m"];
        const genderPos = genders.length;

        return genders[parseInt(Math.random() * genderPos)];
    }

    getPhone (country) {
        let numbers = { 
            BR: { 
                min: 11, max: 11, prefix: "+55" 
            }, 
            US: { 
                min: 10, max: 10, prefix: "+1" 
            }, 
            CA: { 
                min: 10, max: 10, prefix: "+1" 
            }, 
            AU: { 
                min: 9, max: 10, prefix: "+61" 
            } 
        };
        let number = numbers[country].prefix;

        for (let i = 0; i < numbers[country].max; i++) {
            number = number + parseInt(Math.random() * 9);
        }

        return number;
    }

    getName (country, gender) {
        const names = {
            BR: {
                f: [
                    "Maria",
                    "Ana",
                    "Fernanda",
                    "Bruna",
                    "Juliana",
                    "Camila",
                    "Lorena",
                    "Amanda",
                    "Carolina",
                    "LaÃƒÂ­s",
                    "TaÃƒÂ­s",
                    "Thais",
                    "Rafaela",
                    "Daniela",
                    "Gabriela",
                    "LetÃƒÂ­cia",
                    "Bianca",
                    "Clara",
                    "JÃƒÂºlia",
                    "Mayara",
                    "NatÃƒÂ¡lia",
                    "Thalita",
                    "Vanessa",
                    "Giovana",
                    "FlÃƒÂ¡via",
                    "Marina",
                    "Ana Paula",
                    "Mariana",
                    "HeloÃƒÂ­sa",
                    "Juliana",
                    "Isabella",
                    "Karina",
                    "Larissa",
                    "MÃƒÂ´nica",
                    "ThaÃƒÂ­s",
                    "Yasmin",
                    "Beatriz",
                    "Carolina",
                    "Emanuelly",
                    "Fernanda",
                    "Gisele",
                    "Isadora",
                    "Laura",
                    "LetÃƒÂ­cia",
                    "Luiza",
                    "Marina",
                    "Nina",
                    "Raquel",
                    "Sarah",
                    "TaÃƒÂ­s",
                    "ThaynÃƒÂ¡",
                    "Valentina",
                    "Ana Clara",
                    "Angelina",
                    "Antonia",
                    "Bianca",
                    "Camila",
                    "Carolina",
                    "Diana",
                    "Eduarda",
                    "Emilly",
                    "Gabriela",
                    "Helena",
                    "Isabela",
                    "JÃƒÂºlia",
                    "Lara",
                    "Laura",
                    "Luana",
                    "Maria Luiza",
                    "Mariana",
                    "Melissa",
                    "NatÃƒÂ¡lia",
                    "Rafaela",
                    "Sabrina",
                    "Sophie",
                    "ThaÃƒÂ­s",
                    "VitÃƒÂ³ria",
                    "Yasmin",
                    "Ana Beatriz",
                    "Ana Luiza",
                    "Beatriz",
                    "Clara",
                    "Giovana",
                    "Julia",
                    "Laura",
                    "Luiza",
                    "Marina",
                    "Maria Eduarda",
                    "Maria Fernanda",
                    "Mariana",
                    "Rafaela",
                    "Valentina",
                    "Ana Carolina",
                    "Isabella",
                    "Julia",
                    "Laura",
                    "Luana",
                    "Maria",
                    "Maria Luiza",
                    "Rafaela",
                ],
                m: [
                    "JoÃƒÂ£o",
                    "JosÃƒÂ©",
                    "Felipe",
                    "Matheus",
                    "Lucas",
                    "Pedro",
                    "Guilherme",
                    "Gustavo",
                    "Rafael",
                    "Bernardo",
                    "Arthur",
                    "Heitor",
                    "Davi",
                    "Lorenzo",
                    "Miguel",
                    "Gabriel",
                    "Daniel",
                    "Enzo",
                    "Samuel",
                    "AntÃƒÂ´nio",
                    "Caio",
                    "Vitor",
                    "Eduardo",
                    "Matheus",
                    "Henrique",
                    "Lucas",
                    "Arthur",
                    "Davi",
                    "Lorenzo",
                    "Miguel",
                    "Gabriel",
                    "Bernardo",
                    "Heitor",
                    "Felipe",
                    "Rafael",
                    "Guilherme",
                    "Gustavo",
                    "JoÃƒÂ£o",
                    "JosÃƒÂ©",
                    "Samuel",
                    "Matheus",
                    "Bernardo",
                    "Arthur",
                    "Davi",
                    "Lorenzo",
                    "Miguel",
                    "Gabriel",
                    "Heitor",
                    "Felipe",
                    "Rafael",
                    "Guilherme",
                    "Gustavo",
                    "JoÃƒÂ£o",
                    "JosÃƒÂ©",
                    "Samuel",
                    "Matheus",
                    "Bernardo",
                    "Arthur",
                    "Davi",
                    "Lorenzo",
                    "Miguel",
                    "Gabriel",
                    "Heitor",
                    "Felipe",
                    "Rafael",
                    "Guilherme",
                    "Gustavo",
                    "JoÃƒÂ£o",
                    "JosÃƒÂ©",
                    "Samuel",
                    "Matheus",
                    "Bernardo",
                    "Arthur",
                    "Davi",
                    "Lorenzo",
                    "Miguel",
                    "Gabriel",
                    "Heitor",
                    "Felipe",
                    "Rafael",
                    "Guilherme",
                    "Gustavo",
                ],
                ln: [
                    "Silva",
                    "Santos",
                    "Oliveira",
                    "Souza",
                    "Pereira",
                    "Carvalho",
                    "Rodrigues",
                    "Ferreira",
                    "Lima",
                    "Alves",
                    "Gomes",
                    "Martins",
                    "Ribeiro",
                    "Jesus",
                    "Castro",
                    "Cruz",
                    "Costa",
                    "Machado",
                    "Nunes",
                    "Moraes",
                    "Fonseca",
                    "Moreira",
                    "Almeida",
                    "Cardoso",
                    "Nascimento",
                    "Freitas",
                    "Santiago",
                    "Guerra",
                    "Melo",
                    "Dias",
                    "Sousa",
                    "AraÃƒÂºjo",
                    "Pires",
                    "Sampaio",
                    "Vieira",
                    "Castro",
                    "Martins",
                    "Ribeiro",
                    "Jesus",
                    "Costa",
                    "Machado",
                    "Nunes",
                    "Moraes",
                    "Fonseca",
                    "Moreira",
                    "Almeida",
                    "Cardoso",
                    "Nascimento",
                    "Freitas",
                    "Santiago",
                    "Guerra",
                    "Melo",
                    "Dias",
                    "Sousa",
                    "AraÃƒÂºjo",
                    "Pires",
                    "Sampaio",
                    "Vieira",
                    "Castro",
                    "Martins",
                    "Ribeiro",
                    "Jesus",
                    "Costa",
                    "Machado",
                    "Nunes",
                    "Moraes",
                    "Fonseca",
                    "Moreira",
                    "Almeida",
                    "Cardoso",
                    "Nascimento",
                    "Freitas",
                    "Santiago",
                    "Guerra",
                    "Melo",
                    "Dias",
                    "Sousa",
                    "AraÃƒÂºjo",
                    "Pires",
                    "Sampaio",
                    "Vieira",
                ],
            },
            default: {
                f: [
                    "Emma",
                    "Olivia",
                    "Ava",
                    "Sophia",
                    "Emily",
                    "Isabella",
                    "Mia",
                    "Amelia",
                    "Charlotte",
                    "Ella",
                    "Abigail",
                    "Harper",
                    "Elizabeth",
                    "Lily",
                    "Aaliyah",
                    "Sophia",
                    "Evelyn",
                    "Mia",
                    "Grace",
                    "Charlotte",
                    "Ava",
                    "Isabella",
                    "Zoey",
                    "Victoria",
                    "Emily",
                    "Ella",
                    "Amelia",
                    "Madison",
                    "Abigail",
                    "Sarah",
                    "Elizabeth",
                    "Olivia",
                    "Ava",
                    "Sophia",
                    "Isabella",
                    "Lily",
                    "Mia",
                    "Emma",
                    "Charlotte",
                    "Amelia",
                    "Emily",
                    "Abigail",
                    "Harper",
                    "Elizabeth",
                    "Sophia",
                    "Evelyn",
                    "Mia",
                    "Grace",
                    "Charlotte",
                    "Ava",
                    "Isabella",
                    "Zoey",
                    "Victoria",
                    "Emily",
                    "Ella",
                    "Amelia",
                    "Madison",
                    "Abigail",
                    "Sarah",
                    "Elizabeth",
                    "Olivia",
                    "Ava",
                    "Sophia",
                    "Isabella",
                    "Lily",
                    "Mia",
                    "Emma",
                    "Charlotte",
                    "Amelia",
                    "Emily",
                    "Abigail",
                    "Harper",
                    "Elizabeth",
                    "Sophia",
                    "Evelyn",
                    "Mia",
                    "Grace",
                    "Charlotte",
                    "Ava",
                    "Isabella",
                    "Zoey",
                    "Victoria",
                    "Emily",
                    "Ella",
                    "Amelia",
                    "Madison",
                    "Abigail",
                    "Sarah",
                    "Elizabeth",
                ],
                m: [
                    "Liam",
                    "Noah",
                    "William",
                    "James",
                    "Oliver",
                    "Elijah",
                    "Benjamin",
                    "Lucas",
                    "Henry",
                    "Alexander",
                    "Aiden",
                    "Michael",
                    "Ethan",
                    "David",
                    "Jacob",
                    "Daniel",
                    "Matthew",
                    "Joseph",
                    "John",
                    "Wyatt",
                    "Gabriel",
                    "Logan",
                    "Carter",
                    "Henry",
                    "Owen",
                    "Lucas",
                    "Levi",
                    "Charles",
                    "Henry",
                    "Alexander",
                    "Ethan",
                    "Michael",
                    "Eli",
                    "Samuel",
                    "Julian",
                    "Lincoln",
                    "Anthony",
                    "Asher",
                    "Grayson",
                    "Dylan",
                    "Jack",
                    "Joshua",
                    "Nathan",
                    "David",
                    "Liam",
                    "Noah",
                    "William",
                    "James",
                    "Oliver",
                    "Elijah",
                    "Benjamin",
                    "Lucas",
                    "Henry",
                    "Alexander",
                    "Aiden",
                    "Michael",
                    "Ethan",
                    "David",
                    "Jacob",
                    "Daniel",
                    "Matthew",
                    "Joseph",
                    "John",
                    "Wyatt",
                    "Gabriel",
                    "Logan",
                    "Carter",
                    "Henry",
                    "Owen",
                    "Lucas",
                    "Levi",
                    "Charles",
                    "Henry",
                    "Alexander",
                    "Ethan",
                    "Michael",
                    "Eli",
                    "Samuel",
                    "Julian",
                    "Lincoln",
                    "Anthony",
                    "Asher",
                    "Grayson",
                    "Dylan",
                    "Jack",
                    "Joshua",
                    "Nathan",
                    "David",
                ],
                ln: [
                    "Smith",
                    "Johnson",
                    "Brown",
                    "Taylor",
                    "Miller",
                    "Anderson",
                    "Thomas",
                    "Jackson",
                    "White",
                    "Harris",
                    "Martin",
                    "Thompson",
                    "Martinez",
                    "Garcia",
                    "Robinson",
                    "Davis",
                    "Rodriguez",
                    "Wilson",
                    "Lee",
                    "Gonzalez",
                    "Walker",
                    "Hall",
                    "Allen",
                    "Young",
                    "Hernandez",
                    "King",
                    "Wright",
                    "Lopez",
                    "Hill",
                    "Scott",
                    "Green",
                    "Adams",
                    "Baker",
                    "Nelson",
                    "Carter",
                    "Mitchell",
                    "Perez",
                    "Roberts",
                    "Turner",
                    "Phillips",
                    "Campbell",
                    "Parker",
                    "Evans",
                    "Edwards",
                    "Collins",
                    "Stewart",
                    "Sanchez",
                    "Morris",
                ],
            },
        };

        const countryPos = names[country] ? country : 'default';
        const fnPos = names[countryPos][gender].length;
        const lnPos = names[countryPos]['ln'].length;

        return {
            fn: names[countryPos][gender][parseInt(Math.random() * fnPos)],
            ln: names[countryPos]['ln'][parseInt(Math.random() * lnPos)]
        }
    }
}