import { giteehub as giteehubIcon, spinner as spinnerIcon } from '../icons'
import { NOT_INITIALIZED_ERROR } from '../constants'
import moment from 'moment'
import Atwho from '../atwho'
function renderHeader({ meta, user }, instance) {
    const container = document.createElement('div')
    container.lang = "en-US"
    container.className = 'gitment-container gitment-header-container'


    const commentsCount = document.createElement('span')
    commentsCount.innerHTML = `
    ${ meta.comments
        ? `总评论数 • <strong>${meta.comments}</strong> `
        : ''
        }
  `
    container.appendChild(commentsCount)

    const issueLink = document.createElement('a')
    issueLink.className = 'gitment-header-issue-link'
    issueLink.href = meta.html_url
    issueLink.target = '_blank'
    issueLink.innerText = 'Issue Page'
    container.appendChild(issueLink)

    return container
}

function renderComments({ meta, comments, currentPage, user, error }, instance) {
    const container = document.createElement('div')
    container.lang = "en-US"
    container.className = 'gitment-container gitment-comments-container'

    if (error) {
        const errorBlock = document.createElement('div')
        errorBlock.className = 'gitment-comments-error'

        if (error === NOT_INITIALIZED_ERROR
            && user.login
            && user.login.toLowerCase() === instance.owner.toLowerCase()) {
            const initHint = document.createElement('div')
            const initButton = document.createElement('button')
            initButton.className = 'gitment-comments-init-btn'
            initButton.onclick = () => {
                initButton.setAttribute('disabled', true)
                instance.init()
                    .catch(e => {
                        initButton.removeAttribute('disabled')
                        alert(e)
                    })
            }
            initButton.innerText = '初始化评论'
            initHint.appendChild(initButton)
            errorBlock.appendChild(initHint)
        } else {
            errorBlock.innerText = error
        }
        container.appendChild(errorBlock)
        return container
    } else if (comments === undefined) {
        const loading = document.createElement('div')
        loading.innerText = 'Loading comments...'
        loading.className = 'gitment-comments-loading'
        container.appendChild(loading)
        return container
    } else if (!comments.length) {
        const emptyBlock = document.createElement('div')
        emptyBlock.className = 'gitment-comments-empty'
        emptyBlock.innerText = '暂时没有评论！'
        container.appendChild(emptyBlock)
        return container
    }

    const commentsList = document.createElement('ul')
    commentsList.className = 'gitment-comments-list'

    comments.forEach(comment => {
        const createDate = new Date(comment.created_at)
        const commentItem = document.createElement('li')
        commentItem.className = 'gitment-comment'
        commentItem.innerHTML = `
      <a class="gitment-comment-avatar" href="${comment.user.html_url}" target="_blank">
        <img class="gitment-comment-avatar-img" src="${comment.user.avatar_url}"/>
      </a>
      <div class="gitment-comment-main">
        <div class="gitment-comment-header">
          <a class="gitment-comment-name" href="${comment.user.html_url}" target="_blank">
            ${comment.user.name}
          </a>
          ${ meta.user.login == comment.user.login ? ` <span class="giteement-role-label" title="该用户是博客的拥有者">博主</span>`
            : ''
          }
          评论创建于
          <span title="${createDate}">${moment(createDate).format('YYYY年MM月DD日')}</span>
        </div>
        <div id="${comment.id}" class="gitment-comment-body gitment-markdown"></div>
      </div>
    `
        convertComment(instance, comment);
        // dirty
        // use a blank image to trigger height calculating when element rendered
        const imgTrigger = document.createElement('img')
        const markdownBody = commentItem.querySelector('.gitment-comment-body')
        imgTrigger.className = 'gitment-hidden'
        imgTrigger.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
        imgTrigger.onload = () => {
            if (markdownBody.clientHeight > instance.maxCommentHeight) {
                markdownBody.classList.add('gitment-comment-body-folded')
                markdownBody.style.maxHeight = instance.maxCommentHeight + 'px'
                markdownBody.title = 'Click to Expand'
                markdownBody.onclick = () => {
                    markdownBody.classList.remove('gitment-comment-body-folded')
                    markdownBody.style.maxHeight = ''
                    markdownBody.title = ''
                    markdownBody.onclick = null
                }
            }
        }
        commentItem.appendChild(imgTrigger)

        commentsList.appendChild(commentItem)
    })

    container.appendChild(commentsList)

    if (meta) {
        const pageCount = Math.ceil(meta.comments / instance.perPage)
        if (pageCount > 1) {
            const pagination = document.createElement('ul')
            pagination.className = 'gitment-comments-pagination'

            if (currentPage > 1) {
                const previousButton = document.createElement('li')
                previousButton.className = 'gitment-comments-page-item'
                previousButton.innerText = 'Previous'
                previousButton.onclick = () => instance.goto(currentPage - 1)
                pagination.appendChild(previousButton)
            }

            for (let i = 1; i <= pageCount; i++) {
                const pageItem = document.createElement('li')
                pageItem.className = 'gitment-comments-page-item'
                pageItem.innerText = i
                pageItem.onclick = () => instance.goto(i)
                if (currentPage === i) pageItem.classList.add('gitment-selected')
                pagination.appendChild(pageItem)
            }

            if (currentPage < pageCount) {
                const nextButton = document.createElement('li')
                nextButton.className = 'gitment-comments-page-item'
                nextButton.innerText = 'Next'
                nextButton.onclick = () => instance.goto(currentPage + 1)
                pagination.appendChild(nextButton)
            }

            container.appendChild(pagination)
        }
    }

    return container
}

function renderEditor({ user, error, comments }, instance) {
    const container = document.createElement('div')
    container.lang = "en-US"
    container.className = 'gitment-container gitment-editor-container'

    const shouldDisable = user.login && !error ? '' : 'disabled'
    const disabledTip = user.login ? '' : '请登录，在评论！'
    container.innerHTML = `
      ${ user.login
        ? `<a class="gitment-editor-avatar" href="${user.html_url}" target="_blank">
            <img class="gitment-editor-avatar-img" src="${user.avatar_url}"/>
          </a>`
        : user.isLoggingIn
            ? `<div class="gitment-editor-avatar">${spinnerIcon}</div>`
            : `<a class="gitment-editor-avatar" href="${instance.loginLink}" title="login with GitHub">
              ${giteehubIcon}
            </a>`
        }
    </a>
    <div class="gitment-editor-main">
      <div class="gitment-editor-header">
        <nav class="gitment-editor-tabs">
          <button class="gitment-editor-tab gitment-selected">编辑</button>
          <button class="gitment-editor-tab">预览</button>
        </nav>
        <div class="gitment-editor-login">
          ${ user.login
        ? '<a class="gitment-editor-logout-link">退出</a>'
        : user.isLoggingIn
            ? 'Logging in...'
            : `<a class="gitment-editor-login-link" href="${instance.loginLink}">登录</a> 码云`
        }
        </div>
      </div>
      <div class="gitment-editor-body">
        <div class="gitment-editor-write-field">
          <textarea id="commentEditorTextArea" placeholder="发表评论" title="${disabledTip}" ${shouldDisable}></textarea>
        </div>
        <div class="gitment-editor-preview-field gitment-hidden">
          <div class="gitment-editor-preview gitment-markdown"></div>
        </div>
      </div>
    </div>
    <div class="gitment-editor-footer">
      <a class="gitment-editor-footer-tip" href="https://guides.github.com/features/mastering-markdown/" target="_blank">
        支持Markdown的样式
      </a>
      <button class="gitment-editor-submit" title="${disabledTip}" ${shouldDisable}>评论</button>
    </div>
  `
    if (user.login) {
        container.querySelector('.gitment-editor-logout-link').onclick = () => instance.logout()
    }

    const writeField = container.querySelector('.gitment-editor-write-field')
    const previewField = container.querySelector('.gitment-editor-preview-field')

    const textarea = writeField.querySelector('textarea')

    textarea.oninput = () => {
        textarea.style.height = 'auto'
        const style = window.getComputedStyle(textarea, null)
        const height = parseInt(style.height, 10)
        const clientHeight = textarea.clientHeight
        const scrollHeight = textarea.scrollHeight
        if (clientHeight < scrollHeight) {
            textarea.style.height = (height + scrollHeight - clientHeight) + 'px'
        }
    }
    // 加载@功能
    let atwho = new Atwho({
        element: textarea,
        container: container,
        comments: comments
    });
    const [writeTab, previewTab] = container.querySelectorAll('.gitment-editor-tab')
    writeTab.onclick = () => {
        writeTab.classList.add('gitment-selected')
        previewTab.classList.remove('gitment-selected')
        writeField.classList.remove('gitment-hidden')
        previewField.classList.add('gitment-hidden')

        textarea.focus()
    }
    previewTab.onclick = () => {
        previewTab.classList.add('gitment-selected')
        writeTab.classList.remove('gitment-selected')
        previewField.classList.remove('gitment-hidden')
        writeField.classList.add('gitment-hidden')

        const preview = previewField.querySelector('.gitment-editor-preview')
        const content = textarea.value.trim()
        if (!content) {
            preview.innerText = '没有预览'
            return
        }

        preview.innerText = '加载预览中...'
        instance.markdown(content)
            .then(html => preview.innerHTML = html)
    }

    const submitButton = container.querySelector('.gitment-editor-submit')
    submitButton.onclick = () => {
        submitButton.innerText = '提交中...'
        submitButton.setAttribute('disabled', true)
        instance.post(convertCommentSubmit(textarea.value.trim(), atwho.nameMap))
            .then(data => {
                textarea.value = ''
                textarea.style.height = 'auto'
                submitButton.removeAttribute('disabled')
                submitButton.innerText = '评论'
            })
            .catch(e => {
                alert(e)
                submitButton.removeAttribute('disabled')
                submitButton.innerText = '评论'
            })
    }
    return container
}

function renderFooter({}, instance) {
    const container = document.createElement('div')
    container.lang = "en-US"
    container.className = 'gitment-container gitment-footer-container'
    container.innerHTML = `
    Powered by
    <a class="gitment-footer-project-link" href="https://gitee.com/zhousiwei/giteement" target="_blank">
      Giteement
    </a>
  `
    return container
}

function render(state, instance) {
    const container = document.createElement('div')
    container.lang = "en-US"
    container.className = 'gitment-container gitment-root-container'
    container.appendChild(renderHeader(state, instance))
    container.appendChild(renderComments(state, instance))
    container.appendChild(renderEditor(state, instance))
    container.appendChild(renderFooter(state, instance))
    return container
}

function convertCommentSubmit(content, nameMap) {
    if (content.startsWith("@")) {
        let logins = content.match(/^@[^ ]*/g);
        if (logins && logins.length > 0) {
            logins.forEach(e => {
                let name = e.substr(1);
                if (nameMap[name]) {
                    content = content.replace(name, nameMap[name]);
                }
            })
        }
    }
    return content;
}
function convertComment(instance, comment) {
    let content = comment.body;
    let logins = content.match(/^@[^ ]*/g);
    if (logins && logins.length > 0) {
        logins.forEach(e => instance.users(e.substr(1)).then(u => {
            let repStr = "[@" + u.name + "](" + u.html_url + ")";
            content = content.replace("@"+u.login, repStr);
        }).catch(() => {

        }))
    }
    instance.markdown(content)
        .then(html => document.getElementById(comment.id).innerHTML = html.replace(/src="\/assets\//g, "src=\"https://gitee.com/assets/"));
}
export default { render, renderHeader, renderComments, renderEditor, renderFooter }
