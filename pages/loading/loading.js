// const app = getApp();
// Page({
//   data: {
//     tupianUrl: app.globalData.tupianUrl,
//     seconds: 3, // 初始倒计时秒数
//     button: false
//   },

//   onLoad: function () {
//     console.log('准备跳转...');
//     const that = this;
//     that.checkRegistered();
//     const interval = setInterval(() => {
//       that.setData({
//         seconds: that.data.seconds - 1
//       });
//       console.log(`倒计时: ${that.data.seconds}秒`); // 打印当前倒计时

//       if (that.data.seconds <= 0) {
//         clearInterval(interval);
//         console.log('跳转执行。');

//         let that = this;
//         // wx.login({
//         //   success: (res) => {
//         //     wx.request({
//         //       url: `${app.globalData.backUrl}phone.aspx?mbid=129&ituid=106`,
//         //       data: {
//         //         code: res.code
//         //       },
//         //       success(res) {
//         //         let itsid_exist = res.data.value

//         //         app.globalData.itsid = res.data.value.itsid
//         //         console.log("login的itsid:", app.globalData.itsid);
//         //         wx.setStorageSync('itsid', app.globalData.itsid);
//         //         if (itsid_exist.itsid == '0') {
//         //           wx.showModal({
//         //             content: '没有账号，请注册',
//         //             complete: (res) => {
//         //               if (res.cancel) {}
//         //               if (res.confirm) {
//         //                 wx.navigateTo({
//         //                   url: '/subPackages/user/pages/login/login',
//         //                 })
//         //               }
//         //             }
//         //           })
//         //         } else {
//         //           wx.switchTab({
//         //             url: "/pages/home/home",
//         //             success: function () {
//         //               console.log('跳转成功');
//         //             },
//         //             fail: function (err) {
//         //               console.error('跳转失败', err);
//         //             }
//         //           });
//         //         }
//         //       }


//         //     })
//         //   },
//         //   complete() {
//         //     wx.hideLoading()
//         //   }
//         // });


//         // if (app.globalData.userid || wx.getStorageInfoSync('userid')) {
//         //   // 跳转到首页
//         //   wx.switchTab({
//         //     url: "/pages/home/home",
//         //     success: function () {
//         //       console.log('跳转成功');
//         //     },
//         //     fail: function (err) {
//         //       console.error('跳转失败', err);
//         //     }
//         //   });
//         // } else {
//         //   // 跳转到登录
//         //   wx.navigateTo({
//         //     url: "/subPackages/user/pages/login/login",
//         //     success: function () {
//         //       console.log('跳转成功');
//         //     },
//         //     fail: function (err) {
//         //       console.error('跳转失败', err);
//         //     }
//         //   });
//         // }
//       }
//     }, 1000); // 每秒更新一次
//   },
//   // 获取用户信息
//   checkRegistered() {
//     let that = this;

//     wx.login({
//       success(res) {
//         if (res.code) {
//           console.log(res.code);
//           // 发起网络请求
//           wx.request({
//             url: `${app.globalData.backUrl}phone.aspx?ituid=${app.globalData.ituid}&mbid=120&code=${res.code}`,
//             success(result) {
//               console.log(result);
//               app.globalData.openid = result.data.value.openid;

//               wx.request({
//                 method: 'POST',
//                 url: `${app.globalData.backUrl}phone.aspx?ituid=${app.globalData.ituid}&mbid=5002`,
//                 data: {
//                   openid: result.data.value.openid
//                 },
//                 success(res) {
//                   console.log("res:", res);
//                   console.log("是否已注册:", res.data.value);

//                   if (res.data.value) { // 已注册
//                     that.setData({
//                       Registered: true
//                     });

//                     // 获取itpnid
//                     wx.request({
//                       method: 'POST',
//                       url: `${app.globalData.backUrl}phone.aspx?ituid=${app.globalData.ituid}&mbid=9903`,
//                       data: {
//                         openid: app.globalData.openid
//                       },
//                       success(res) {
//                         console.log(res);
//                         app.globalData.itpnId = res.data.value.itpnId;
//                         console.log("itpnId:" + app.globalData.itpnId);
//                       }
//                     });

//                     // 获取当前用户的在ituser表中UserID
//                     wx.login({
//                       success: (res) => {
//                         wx.request({
//                           url: `${app.globalData.backUrl}phone.aspx?mbid=129&ituid=${app.globalData.ituid}`,
//                           data: {
//                             code: res.code
//                           },
//                           success(res3) {
//                             console.log("res3是：", res3);
//                             app.globalData.userid = res3.data.value.userid;
//                             console.log("userid是:" + app.globalData.userid);
//                             // 更新动态itsid
//                             let userinfo = wx.getStorageSync(app.globalData.projectName);
//                             let itsid_exist = res3.data.value;
//                             if (userinfo.itsid) {
//                               userinfo.itsid = itsid_exist.itsid;
//                             } else {
//                               userinfo = {
//                                 itsid: itsid_exist.itsid
//                               };
//                             }
//                             wx.setStorageSync(app.globalData.projectName, userinfo);
//                             const itsid = res3.data.value.itsid;
//                             console.log('存储 itsid:', res3.data.value.itsid);
//                             wx.setStorageSync('itsid', itsid);
//                             app.globalData.itsid = itsid;
//                             wx.switchTab({
//                               url: '/pages/home/home',
//                             });
//                           } // 关闭 success(res3)
//                         }); // 关闭 wx.request
//                       } // 关闭 wx.login 的 success
//                     }); // 关闭 wx.login
//                   } else { // 未注册
//                     console.log("22");
//                     that.setData({
//                       Registered: false,
//                       button: true
//                     });

//                     wx.showModal({
//                       title: '提示',
//                       content: '未注册为新用户，请点击授权登录',
//                     });
//                   } // 关闭 else
//                 } // 关闭 success(res)
//               }); // 关闭 wx.request (mbid=5002)
//             } // 关闭 success(result)
//           }); // 关闭 wx.request (mbid=120)
//         } else {
//           console.log('获取注册状态失败', res.errMsg);
//         } // 关闭 else
//       } // 关闭 wx.login 的 success
//     }); // 关闭 wx.login
//   }, // 关闭 checkRegistered 方法
//   getPhoneNumber(e) {

//     console.log(e.detail);
//     console.log(e.detail.code) // 动态令牌
//     console.log(e.detail.errMsg) // 回调信息（成功失败都会返回）
//     console.log(e.detail.errno) // 错误码（失败时返回）
//     if (e.detail.errMsg === 'getPhoneNumber:ok') {
//       // 用户同意授权，发送加密数据到服务器
//       const {
//         encryptedData,
//         iv
//       } = e.detail;
//       wx.login({
//         success: (res) => {
//           const code = res.code; // 获取临时登录凭证
//           // 将 code、encryptedData、iv 发送到后端
//           wx.request({
//             url: `${app.globalData.backUrl}phone.aspx?mbid=60&ituid=106`,
//             method: 'POST',
//             data: {
//               code: e.detail.code,
//               js_code: code
//             },
//             success: (res) => {
//               console.log(res);
//               console.log("aaaaSSSSSDASDADWRQEW");
//               // 登录成功，保存 token 或其他登录态
//               wx.setStorageSync('token', res.data.token);
//               wx.request({
//                 url: `${app.globalData.backUrl}phone.aspx?mbid=10620&ituid=106`,
//                 method: 'POST',
//                 data: {
//                   openid: res.data.openid,
//                   phone: res.data.phone_info,
//                   invite: 0
//                 }
//               })
//               //获取当前用户的在ituser表中UserID
//               wx.login({
//                 success: (res) => {
//                   wx.request({
//                     url: `${app.globalData.backUrl}phone.aspx?mbid=129&ituid=${app.globalData.ituid}`,
//                     data: {
//                       code: res.code
//                     },
//                     success(res3) {
//                       console.log("res3是：", res3)
//                       app.globalData.userid = res3.data.value.userid
//                       console.log("userid是:" + app.globalData.userid);
//                       // 更新动态itsid
//                       let userinfo = wx.getStorageSync(app.globalData.projectName);
//                       let itsid_exist = res3.data.value
//                       if (userinfo.itsid) {
//                         userinfo.itsid = itsid_exist.itsid
//                       } else {
//                         userinfo = {
//                           itsid: itsid_exist.itsid
//                         }
//                       }
//                       wx.setStorageSync(app.globalData.projectName, userinfo)
//                       wx.setStorageSync('itsid', res3.data.value.itsid);
//                     }
//                   })
//                 }
//               })
//               wx.switchTab({
//                 url: '/pages/home/home',
//               })
//               // wx.showToast({
//               //   title: '登录成功'
//               // });
//             }
//           });

//         }
//       });
//     } else {
//       // 用户拒绝授权
//       wx.showToast({
//         title: '需要手机号才能登录',
//         icon: 'none'
//       });
//     }

//   },
// });







const app = getApp();
Page({
  data: {
    tupianUrl: app.globalData.tupianUrl,
    seconds: 5 // 初始倒计时秒数
  },

  onLoad: function () {
    console.log('准备跳转...');
    const that = this;
    // 将interval存储到this中，以便其他方法访问
    this.interval = setInterval(() => {
      that.setData({
        seconds: that.data.seconds - 1
      });
      console.log(`倒计时: ${that.data.seconds}秒`);

      if (that.data.seconds <= 0) {
        clearInterval(that.interval);
        that.executeJump(); // 提取跳转逻辑到单独方法
      }
    }, 1000);
  },
    
  // 提取跳转逻辑到单独方法
  executeJump: function() {
    console.log('跳转执行。');
    let that = this;
    wx.switchTab({
      url: '/pages/home/home',
    })
    // wx.showToast({
    //   title: '加载中',
    //   icon: 'loading',
    //   duration: 2000,
    //   mask: true,
    // })
    if(wx.getStorageSync('itsid')){
      wx.setStorageSync('isLoginSuccess', true)
      wx.switchTab({
        url: '/pages/home/home',
      })
    }
    else {
      wx.setStorageSync('isLoginSuccess', false)
      wx.switchTab({
        url: '/pages/home/home',
      })
    }
    // wx.login({
    //   success: (res) => {
    //     wx.request({
    //       url: `${app.globalData.backUrl}phone.aspx?mbid=129&ituid=106`,
    //       data: {
    //         code: res.code
    //       },
    //       success(res) {
    //         let itsid_exist = res.data.value
    //         // app.globalData.itsid = res.data.value.itsid
    //         // console.log("login的itsid:", app.globalData.itsid);
    //         // wx.setStorageSync('itsid', app.globalData.itsid);
    //         console.log(res)
    //         wx.hideToast()
    //         if (itsid_exist.itsid == '0') {
    //           wx.setStorageSync('isLoginSuccess', false)
    //           wx.switchTab({
    //             url: '/pages/home/home',
    //           })
    //           // wx.showModal({
    //           //   content: '没有账号，请注册',
    //           //   complete: (res) => {
    //           //     if (res.cancel) {}
    //           //     if (res.confirm) {
    //           //       wx.navigateTo({
    //           //         url: '/subPackages/user/pages/register/register',
    //           //       })
    //           //     }
    //           //   }
    //           // })
    //         } else {
    //           wx.setStorageSync('isLoginSuccess', true)
    //           wx.switchTab({
    //             url: "/pages/home/home",
    //             success: function () {
    //               console.log('跳转成功');
    //             },
    //             fail: function (err) {
    //               console.error('跳转失败', err);
    //             }
    //           });
    //         }
    //       }
    //     })
    //   },
    // });
  },

  passCountDown() {
    // 清除定时器
    clearInterval(this.interval);
    // 直接执行跳转逻辑
    this.executeJump();
  }

});