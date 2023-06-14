import { PicGo } from 'picgo'
import FormData from 'form-data'
// import { FormData } from 'formdata-polyfill/esm.min.js'

import crypto from 'crypto'

export = (ctx: PicGo) => {
  const register = (): void => {
    ctx.helper.uploader.register('minify-picgo-host', {
      async handle (ctx) {
        const imgList = ctx.output
        for (const imgItem of imgList) {
          // ctx.log.info(ctx.getConfig('picBed.minify-picgo-host'))
          // ctx.log.info(imgItem)
          // ctx.log.info(ctx.getConfig())

          const userConfig: any = ctx.getConfig('picBed.minify-picgo-host')
          // ctx.log.info('userConfig', userConfig)
          const hmac = crypto.createHmac('sha256', userConfig.secret)
          hmac.update(`${userConfig.username}-${userConfig.userpw}`)
          const utoken = hmac.digest('hex')

          const formData = new FormData()
          formData.append('filepond', imgItem.buffer, { filename: imgItem.fileName })
          // formData.append('x1', 1)
          // ctx.log.info('formData', formData.getBuffer())
          // ctx.log.info('imgList[0].buffer', imgList[0].buffer)
          // ctx.log.info('formData end')
          // ctx.log.info('formData--len', formData.getLengthSync())

          // ctx.log.info('formData--header', formData.getHeaders())
          let res
          try {
            res = await ctx.request({
              url: `${userConfig.host}/upload`,
              method: 'POST',
              data: formData.getBuffer(),
              // body: formData,
              resolveWithFullResponse: true,
              headers: {
                utoken,
                ...formData.getHeaders(),
                'Content-Length': formData.getLengthSync()
              }
            }) // { status: number, data: IRes }
          } catch (e) {
            ctx.emit('notification', {
              title: 'upload error',
              body: e.message
            })
            ctx.log.error('minify upload error', e)
            throw new Error(e)
          }

          if (!res.data || res.data.code !== 1) {
            ctx.emit('notification', {
              title: 'upload error',
              body: res.data.msg
            })
          }
          delete imgItem.buffer
          delete imgItem.base64Image
          imgItem.imgUrl = res.data.data.url

          // ctx.log.info('res', JSON.stringify(res.data))
        }

        return ctx
      },
      config (ctx) {
        return configSet(ctx)
      }
    })
    // ctx.helper.transformer.register('minify-picgo-host', {
    //   handle (ctx) {
    //     console.log(ctx)
    //   }
    // })
    // ctx.helper.beforeTransformPlugins.register('minify-picgo-host', {
    //   handle (ctx) {
    //     console.log(ctx)
    //   }
    // })
    // ctx.helper.beforeUploadPlugins.register('minify-picgo-host', {
    //   handle (ctx) {
    //     console.log(ctx)
    //   }
    // })
    // ctx.helper.afterUploadPlugins.register('minify-picgo-host', {
    //   handle (ctx) {
    //     console.log(ctx)
    //   }
    // })
  }
  const commands = (ctx: PicGo) => [{
    label: '',
    key: '',
    name: '',
    async handle (ctx: PicGo, guiApi: any) {}
  }]

  const configSet = ctx => {
    const userConfig = ctx.getConfig('picBed.minify-picgo-host') || {}
    return [{
      alias: '服务器地址',
      name: 'host',
      type: 'input',
      default: userConfig.host || '',
      required: true
    }, {
      alias: '服务器密钥',
      name: 'secret',
      type: 'input',
      default: userConfig.utoken || '',
      required: true
    }, {
      alias: '用户名',
      name: 'username',
      type: 'input',
      default: userConfig.username || '',
      required: true
    }, {
      alias: '密码',
      name: 'userpw',
      type: 'input',
      default: userConfig.userpw || '',
      required: true
    }]
  }
  return {
    name: 'minify上传',
    // uploader: 'minify-picgo-host',
    // transformer: 'minify-picgo-host',
    config: configSet,
    // commands,
    register
  }
}
