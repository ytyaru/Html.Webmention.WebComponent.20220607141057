class ZipDownloader {
    async download() {
        const zip = new JSZip()
        const html = this.#makeScript() + '\n' + this.#makeMpurseSendButtons() + '\n' + this.#makeNote()
        zip.file('index.html', html)
        zip.file('article-1.html', html)
        const res = await fetch('./js/mpurse-send-button.js')
        const js = await res.text()
        zip.file('mpurse-send-button.js', js)
        const file = await zip.generateAsync({type:'blob'})
        const url = (window.URL || window.webkitURL).createObjectURL(file);
        const download = document.createElement('a');
        download.href = url;
        download.download = 'mpurse-send-button-webcomponent.zip';
        download.click();
        (window.URL || window.webkitURL).revokeObjectURL(url);
        this.#toast(`ZIPファイルをダウンロードしました！`)
    }
    #toast(message) {
        if (Toastify) { Toastify({text: message, position:'center'}).showToast(); }
        else { alert(message) }
    }
    #makeScript() { return `<script src="./mpurse-send-button.js"></script>` }
    #makeMpurseSendButtons() {
        return this.#makeButton() + '<br>'
                + this.#makeButtonTo() + '<br>'
                + this.#makeButtonToImg('coin-mark') + ''
                + this.#makeButtonToImg('coin-monar') + ''
                + this.#makeButtonToImg('monar-mark') + ''
                + this.#makeButtonToImgSize('coin-mark', 256) + ''
                + this.#makeButtonToImgSize('coin-monar', 256) + ''
                + this.#makeButtonToImgSize('monar-mark', 256) + ''
    }
    #makeButton() {
        const attrs = []       
        for (const id of ['to', 'asset', 'amount', 'memo', 'img', 'img-src', 'img-size', 'title', 'ok-msg', 'ng-msg']) {
            const value = document.getElementById(id).value
            if (value) { attrs.push(`${id}="${value}"`) }
        }
        return `<mpurse-send-button ${attrs.join(' ')}></mpurse-send-button>`
    }
    #makeButtonTo() { return `<mpurse-send-button to="${document.getElementById('to').value}"></mpurse-send-button>` }
    #makeButtonToImg(img) { return `<mpurse-send-button to="${document.getElementById('to').value}" img="${img}"></mpurse-send-button>` }
    #makeButtonToImgSize(img,size) { return `<mpurse-send-button to="${document.getElementById('to').value}" img="${img}" img-size="${size}"></mpurse-send-button>` }
    #makeNote() { return `<p>　HTMLソースコードをご覧ください。画像のBase64を含めずに書いてあることがわかります。Base64の実体はmpurse-send-button.jsにあります。HTMLはそれを参照しています。参照しているだけなのでボタンをいくつ作ってもファイルサイズは増えません。<a href="https://ytyaru.github.io/Html.MonaCoin.Button.Component.Generator.20220526192239/">元記事</a></p><p>　このボタンで投げモナするにはHTTPSサーバにアップする必要があります。mpurse APIの仕様です。</p>` }
}
