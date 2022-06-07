window.addEventListener('DOMContentLoaded', async(event) => {
    console.log('DOMContentLoaded!!');
    /*
    document.getElementById('text').focus()
    generate()
    const mention = new WebMention() 
    await mention.make()
    */
    /*
    document.getElementById('text').addEventListener('input', (event) => { generate() });
    document.getElementById('url').addEventListener('input', (event) => { generate() });
    document.getElementById('hashtags').addEventListener('input', (event) => { generate() });
    document.getElementById('title').addEventListener('input', (event) => { generate() });
    document.getElementById('src').addEventListener('input', (event) => { generate() });
    document.getElementById('size').addEventListener('input', (event) => { generate() });
    function generate() {
        const code = `<script src="tweet-button.js"></script>\n` + generateElement()
        document.getElementById('export').innerHTML = code
        document.getElementById('export-code').value = code
        copy()
    }
    async function copy() {
        try {
            await navigator.clipboard.writeText(document.getElementById('export-code').value) 
            toast('クリップボードにコピーしました！')
        }
        catch(e) { console.debug('クリップボードのコピーに失敗しました……。', e) }
    }
    function toast(message) {
        console.debug(message)
        if (Toastify) {
            Toastify({
                text: message,
                gravity: 'bottom', // `top` or `bottom`
                position: 'right',
            }).showToast();
        } else { alert(message) }
    }
    function generateElement() {
        const attrs = new Map()
        for (const key of ['text', 'url', 'hashtags', 'title', 'src', 'size']) {
            const value = document.getElementById(key).value
            if (value) {attrs.set(key, value)}
        }
        console.log(attrs.entries())
        console.log([...attrs.entries()])
        const attr = (0 < attrs.size) ? ' ' + [...attrs.entries()].map((e)=>`${e[0]}="${e[1]}"`).join(' ') : ''
        return `<tweet-button${attr}></tweet-button>`
    }
    */
});
window.addEventListener('beforeunload', (event) => {
    console.log('beforeunload!!');
});

