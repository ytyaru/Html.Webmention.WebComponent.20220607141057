class TootButton extends HTMLElement {
    constructor(domain) {
        super();
        this.domain = domain
        this.status = ''
        this.imgSrc = null
        this.imgSize = '64'
        this.title = 'トゥートする'
        this.okMsg = 'トゥートしました！'
        this.ngMsg = 'キャンセルしました。'
    }
    static get observedAttributes() {
        return ['domain', 'status', 'img-src', 'img-size', 'title', 'ok-msg', 'ng-msg'];
    }
    async connectedCallback() {
        //const shadow = this.attachShadow({ mode: 'closed' });
        const shadow = this.attachShadow({ mode: 'open' }); // マウスイベント登録に必要だった。CSS的にはclosedにしたいのに。
        const button = await this.#make()
        console.debug(button.innerHTML)
        //shadow.innerHTML = `<style>${this.#cssBase()}${this.#cssAnimation()}</style>${button.innerHTML}` 
        
        shadow.innerHTML = `<style>${this.#cssBase()}${this.#cssButton()}${this.#cssAnimation()}${this.#cssFocsAnimation()}</style>${button.outerHTML}` 
        // pointer系 = mouse系 + touch系 + pen系
        //this.shadowRoot.querySelector('img').addEventListener('pointerdown', (e)=>{ e.target.classList.add('jump'); }, false);
        //this.shadowRoot.querySelector('img').addEventListener('pointerover', (e)=>{ e.target.classList.add('flip'); }, false);
        //this.shadowRoot.querySelector('img').addEventListener('mouseover', (e)=>{ e.target.classList.add('flip'); }, false);
        this.shadowRoot.querySelector('img').addEventListener('animationend', (e)=>{ e.target.classList.remove('jump'); e.target.classList.remove('flip'); }, false);
        this.#addListenerEvent()
        this.#redirectCallback()
    }
    #cssBase() { return `img{cursor:pointer; text-align:center; vertical-align:middle; user-select:none;}` }
    #cssButton() { return `
button {
    width: auto;
    padding: 0;
    margin: 0;
    background: none;
    border: 0;
    font-size: 0;
    line-height: 0;
    overflow: visible;
    cursor: pointer;
}`
}
    #cssAnimation() { return `
@keyframes jump {
  from {
    position:relative;
    bottom:0;
    transform: rotateY(0);
  }
  45% {
    position:relative;
    bottom: ${this.imgSize*2}px;
  }
  55% {
    position:relative;
    bottom: ${this.imgSize*2}px;
  }
  to {
    position:relative;
    bottom: 0;
    transform: rotateY(720deg);
  }
}
.jump {
  transform-origin: 50% 50%;
  animation: jump .5s linear alternate;
}
@keyframes flip {
  from {
    transform: rotateY(0);
  }
  to {
    transform: rotateY(180deg);
  }
}
.flip {
  transform-origin: 50% 50%;
  animation: flip .20s linear alternate;
}`; }
    #cssFocsAnimation() { return `
button {
  width: ${this.imgSize}px;
  height: ${this.imgSize}px;
}
/* アニメが完了するまでクリックできなくなる
button:focus {
  transform-origin: 50% 50%;
  animation: flip .20s linear alternate;
}
*/
button, button img {
  width: ${this.imgSize}px;
  height: ${this.imgSize}px;
  z-index: 1;
}
button:focus, button:focus img {
  width: ${this.imgSize * 1.5}px;
  height: ${this.imgSize * 1.5}px;
  z-index: 9999;
  vertical-align:bottom;
}
`
    }
    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue) { return; }
        if ('img-src' === property) { this.imgSrc = newValue}
        else if ('img-size' === property) { this.imgSize = newValue}
        else if ('ok-msg' === property) { this.okMsg = newValue}
        else if ('ng-msg' === property) { this.ngMsg = newValue}
        else { this[property] = newValue; }
    }
    async #redirectCallback() { // 認証したあとに戻ってきたらトゥートする
        const url = new URL(location.href)
        // マストドンAPI oauth/authorize でリダイレクトされた場合（認証を拒否した場合）
        if(url.searchParams.has('error') && url.searchParams.get('domain')) {
            console.debug(this.domain, url.searchParams.get('domain'))
            if (this.domain === url.searchParams.get('domain')) {
                console.debug((url.searchParams.has('error_description')) ? decodeURI(url.searchParams.get('error_description')) : '認証エラーです。')
                //alert((url.searchParams.has('error_description')) ? decodeURI(url.searchParams.get('error_description')) : '認証エラーです。')
                //this.#toast((url.searchParams.has('error_description')) ? decodeURI(url.searchParams.get('error_description')) : '認証エラーです。', true)
                this.#toast('キャンセルしました')
                const params = url.searchParams;
                params.delete('error');
                params.delete('error_description');
                history.replaceState('', '', url.pathname);
            }
        }
        // マストドンAPI oauth/authorize でリダイレクトされた場合（認証に成功した場合）
        else if (url.searchParams.has('code') && url.searchParams.get('domain')) {
            const domain = url.searchParams.get('domain') // mstdn.jp, pawoo.net, ...
            const tooter = new Tooter(domain)
            const code = url.searchParams.get('code')
            // 認証コード(code)をURLパラメータから削除する
            const params = url.searchParams;
            params.delete('code');
            history.replaceState('', '', url.pathname);
            // トークンを取得して有効であることを確認しトゥートする
            const status = sessionStorage.getItem(`status`)
            console.debug('----- authorized -----')
            console.debug('client_id:', sessionStorage.getItem(`${domain}-client_id`))
            console.debug('client_secret:', sessionStorage.getItem(`${domain}-client_secret`))
            console.debug('認証コード', code)
            // client_id, client_secretはsessionStorageに保存しておく必要がある
            const json = await tooter.getToken(sessionStorage.getItem(`${domain}-client_id`), sessionStorage.getItem(`${domain}-client_secret`), code)
            this.#errorApi(json)
            console.debug('access_token:', json.access_token)
            sessionStorage.setItem(`${domain}-access_token`, json.access_token);
            const accessToken = json.access_token
            const v = await tooter.verify(accessToken)
            console.debug(v)
            this.#errorApi(v)
            const res = await tooter.toot(accessToken, status)
            this.#errorApi(res)
            this.#requestWebmention(res)
            sessionStorage.removeItem(`status`)
            //this.classList.remove('jump');
            //this.classList.remove('flip');
            this.#tootEvent(res)
            console.debug('----- 以上 -----')
        }
    }
    #errorApi(json) {
        console.debug(json)
        if (json.hasOwnProperty('error')) {
            this.#toast(json.error, true)
            //sessionStorage.removeItem(`${domain}-app`, JSON.stringify(app));
            sessionStorage.removeItem(`${domain}-client_id`, app.client_id);
            sessionStorage.removeItem(`${domain}-client_secret`, app.client_secret);
            //sessionStorage.removeItem(`status`);
            sessionStorage.removeItem(`${domain}-access_token`, json.access_token);
            throw new Error(`マストドンAPIでエラーがありました。詳細はデバッグログやsessionStorageを参照してください。: ${JSON.stringify(json)}`)
        }
    }
    #tootEvent(json) { 
        const params = {
            domain: this.domain,
            json: json,
        }
        this.dispatchEvent(new CustomEvent('toot', {detail: params}));
    }
    async #make() {
        const button = await this.#makeSendButton()
        const img = this.#makeSendButtonImg()
        button.appendChild(img)
        return button
        /*
        const a = await this.#makeSendButtonA()
        const img = this.#makeSendButtonImg()
        a.appendChild(img)
        return a
        */
    }
    #makeSendButtonA() {
        const a = document.createElement('a')
        a.setAttribute('title', this.title)
        a.setAttribute('class', `vov swivel-horizontal-double`) // アニメーション用
        return a
    }
    #makeSendButton() {
        const button = document.createElement('button')
        //a.setAttribute('title', this.title)
        button.setAttribute('title', (this.domain) ? `${this.domain}へトゥートする` : `任意のインスタンスへトゥートする`)
        return button
    }
    #makeSendButtonImg() {
        const img = document.createElement('img')
        const size = this.#parseImgSize()
        const [width, height] = this.#parseImgSize()
        img.setAttribute('width', `${width}`)
        img.setAttribute('height', `${height}`)
        img.setAttribute('src', `${this.#getImgSrc()}`)
        //img.classList.add('flip'); // 初回アニメーション用
        return img
    }
    #getImgWidth() { return parseInt( (0 <= this.imgSize.indexOf('x')) ? this.imgSize.split('x')[0] : this.imgSize) }
    #getImgHeight() { return parseInt( (0 <= this.imgSize.indexOf('x')) ? this.imgSize.split('x')[1] : this.imgSize) }
    #parseImgSize() {
        if (0 <= this.imgSize.indexOf('x')) { return this.imgSize.split('x').map(v=>(parseInt(v)) ? parseInt(v) : 64) }
        else { return (parseInt(this.imgSize)) ? [parseInt(this.imgSize), parseInt(this.imgSize)] : [64, 64] }
    }
    #getImgSrc() {
        console.debug(this.domain, this.imgSize)
        if (this.imgSrc) { return this.imgSrc }
        //return `http://www.google.com/s2/favicons?domain=${this.domain}`
        if (this.domain) { return `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${this.domain}&size=${this.imgSize}` }
        return `./asset/image/mastodon_mascot.svg`
        /*
        if (this.imgSrc) { return this.imgSrc }
        if (this.img) {
            const num = parseInt(this.img)
            if (isNaN(num)) {
                const key = this.icon.getKey(this.img, this.imgSize)
                return (this.icon.Base64.has(key)) ? this.icon.Base64.get(key) : this.icon.Default }
            else {
                if (this.icon.Base64.size <= num) { return this.icon.Default }
                if (num < this.icon.Base64.size) { return [...this.icon.Base64.values()][num] }
                return this.icon.get(this.img, this.imgSize)
            }
        }
        return this.icon.Default
        */
    }
    #addListenerEvent() { // トゥートボタンを押したときの動作を実装する
        //this.addEventListener('pointerdown', async(event) => {
        this.addEventListener('click', async(event) => { console.debug('click toot-button'); await this.#toot(event.target) });
        // clickとあわせて２回発行されてしまう！　もうスマホ側は知らん。
        //this.addEventListener('pointerdown', async(event) => { console.debug('pointer-down toot-button'); this.dispatchEvent(new Event('click')) });
        //this.addEventListener('pointerdown', async(event) => { this.#toot() });
    }
    #getStatus() {
        if (this.status) { return this.status }
        // toot-dialogのtoot-status要素から取得しようと思ったが、shadow要素のためか取得できなかった。
    }
    #getDomain() {
        const domain = window.prompt('インスタンスのURLかドメイン名を入力してください。');
        try { return new URL(domain).hostname }
        catch (e) { return domain }
    }
    #isExistInstance() {
        // 入力したドメインが存在するか（リンク切れでないか）
        // 入力したドメインはマストドンのインスタンスか（どうやってそれを判定するか）
        return true
    }
    async #toot(target) {
        console.debug('トゥートボタンを押しました。')
        const status = this.#getStatus()
        console.debug(status)
        if (!status || 0 === status.trim().length) {
            this.#toast('トゥート内容を入れてください。', true)
            return
        }
        //event.target.classList.add('jump');
        target.classList.add('jump');
        const domain = (this.domain) ? this.domain : this.#getDomain()
        this.domain = domain
        console.debug(domain)
        const tooter = new Tooter(domain)
        const access_token = sessionStorage.getItem(`${domain}-access_token`)
        if (access_token && tooter.verify(access_token)) {
            console.debug('既存のトークンが有効なため即座にトゥートします。');
            //const res = await tooter.toot(access_token, this.status)
            const res = await tooter.toot(access_token, this.#getStatus())
            this.#errorApi(res)
            this.#requestWebmention(res)
            //event.target.classList.remove('jump');
            //event.target.classList.remove('flip');
            this.#tootEvent(res)
        } else {
            console.debug('既存のトークンがないか無効のため、新しいアクセストークンを発行します。');
            const app = await tooter.createApp().catch(e=>alert(e))
            this.#errorApi(app)
            console.debug(app.client_id)
            console.debug(app.client_secret)
            console.debug(sessionStorage.getItem(`${domain}-app`))
            console.debug(sessionStorage.getItem(`${domain}-client_id`))
            console.debug(sessionStorage.getItem(`${domain}-client_secret`))
            sessionStorage.setItem(`${domain}-app`, JSON.stringify(app));
            sessionStorage.setItem(`${domain}-client_id`, app.client_id);
            sessionStorage.setItem(`${domain}-client_secret`, app.client_secret);
            const status = document.getElementById('status')
            //sessionStorage.setItem(`status`, (status.hasAttribute('contenteditable')) ? status.innerText : status.value);
            //sessionStorage.setItem(`status`, this.status);
            sessionStorage.setItem(`status`, this.#getStatus());
            tooter.authorize(app.client_id)
        }
    }
    async #requestWebmention(json) { // json: toot応答
        const url = 'https://webmention.io/aaronpk/webmention'
        const params = new URLSearchParams();
        params.set('source', json.url) // トゥートのURL。https://pawoo.net/web/statuses/108412336135014487 など
        params.set('target', location.href) // コメントを表示するサイトのURL。https://ytyaru.github.io/ など
        const body = params.toString()
        const datas = {
            method: 'POST',
            headers: {'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'},
            body: body,
        }
        console.debug(url)
        console.debug(params)
        console.debug(datas)
        const res = await fetch(url, datas)
        console.debug(res)
        const j = await res.json()
        console.debug(j)
        return j
    }
    #toast(message, error=false) {
        console.debug(message)
        const options = {
            text: message, 
            position:'center'
        }
        if (error) { options.style = { background: "red" } }
        if (Toastify) { Toastify(options).showToast(); }
        else { alert(message) }
    }
}
window.addEventListener('DOMContentLoaded', (event) => {
    customElements.define('toot-button', TootButton);
});

