class MpurseSendButtonGenerator {
    async copy() {
        try {
            this.#toast('クリップボードにコピーしました！')
            await navigator.clipboard.writeText(document.getElementById('export-code').value) 
        }
        catch(e) { console.debug('クリップボードのコピーに失敗しました……。', e) }
    }
    #toast(message) {
        if (Toastify) {
            Toastify({
                text: message,
                position: 'center',
                //duration: 3000,
                //destination: "https://github.com/apvarun/toastify-js",
                //newWindow: true,
                //close: true,
                //gravity: "top", // `top` or `bottom`
                //position: "left", // `left`, `center` or `right`
                //stopOnFocus: true, // Prevents dismissing of toast on hover
                //style: {
                //    background: "linear-gradient(to right, #00b09b, #96c93d)",
                //},
                //onClick: function(){} // Callback after click
            }).showToast();
        } else { alert(message) }
    }
    async generate(button) {
        await this.#export(this.#makeMpurseSendButton())
    }
    async #export(button) {
        document.getElementById('export').innerHTML = button
        const js = await this.#getScript()
        document.getElementById('export-code').value = js + button
    }
    #makeMpurseSendButton() {
        const attrs = []       
        for (const id of ['to', 'asset', 'amount', 'memo', 'img', 'img-src', 'img-size', 'title', 'ok-msg', 'ng-msg']) {
            const value = document.getElementById(id).value
            if (value) { attrs.push(`${id}="${value}"`) }
        }
        return `<mpurse-send-button ${attrs.join(' ')}></mpurse-send-button>`
    }
    async #getScript() {
        const res = await fetch('./js/mpurse-send-button.js')
        const js = await res.text()
        return `<script>${js}</script>`
    }
}

