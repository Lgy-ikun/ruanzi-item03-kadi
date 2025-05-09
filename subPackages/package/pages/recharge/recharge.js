// const app = getApp();
// Page({
//   data: {
//     tupianUrl: app.globalData.tupianUrl,
//     balance: 0.00, // 初始余额，保留两位小数
//     rechargeOptions: [200, 300, 500, 1000],
//     selectedRecharge: 200, // 默认选中500元
//   },
//   onLoad: function() {
//     this.formatBalance(); // 页面加载时格式化余额
//   },
//   formatBalance: function() {
//     // 确保余额总是显示两位小数
//     this.setData({
//       balance: parseFloat(this.data.balance).toFixed(2)
//     });
//   },
//   selectRecharge: function(e) {
//     const value = e.currentTarget.dataset.value;
//     this.setData({
//       selectedRecharge: value
//     });
//   },
//   recharge: function() {
//     let that=this
//     const rechargeAmount = this.data.selectedRecharge;
//     if (rechargeAmount <= 0) {
//       wx.showToast({
//         title: '请选择充值金额',
//         icon: 'none'
//       });
//       return;
//     }
//     let selectedRecharge =that.data.selectedRecharge
//     if(selectedRecharge=200){
//       that.setData({
//  MCODE:901
//       })
//     }else if (selectedRecharge=300){
//       that.setData({
//          MCODE:902
//               })
//     }else if (selectedRecharge=500){
//       that.setData({
//          MCODE:903
//               })
//     }else if (selectedRecharge=1000){
//       that.setData({
//          MCODE:904
//               })
//     }
//     console.log(that.data.selectedRecharge);
//    const itsid= wx.getStorageSync('itsid')
//     console.log(itsid);
//     // 这里可以添加调用后端接口的代码
//       wx.request({
//             url: `${app.globalData.backUrl}phone.aspx?mbid=121&ituid=${app.globalData.ituid}&itsid=${itsid}`,
//             data: {
//               MCODE:that.data.MCODE,
//               OPID: '1000',
//               UNITID: '2',
//               NUM:'1',
//               USERID: '0',
//               NOTE: ' ',
//               AMT: ''
//             },
//             method: 'POST',
//             header: {
//               'content-type': 'application/json' // 设置请求的header，通常用于指定请求数据的格式
//             },
//             success: (res) => {
//               console.log("mbid=121:", res)
//               wx.showToast({
//                 title: '支付成功',
//                 duration: 2000
//               })
//               that.setData({
//                 visible: false
//               })
//               wx.requestPayment({
//                 "timeStamp": res.data.timeStamp, //时间戳
//                 "nonceStr": res.data.nonceStr, //随机字符串
//                 "package": res.data.package, //统一下单接口返回的prepay_id参数值，格式为prepay_id=***
//                 "signType": res.data.signType, //签名算法，应与后台下单时的值一致
//                 "paySign": res.data.paySign, //签名，具体见微信支付文档
//                 // "totalFee": 1,   //支付金额
//                 "success": function (res) {
//                   wx.showToast({
//                     title: '支付成功',
//                     duration: 2000
//                   })
//                   setTimeout(() => {
//                     that.setData({
//                       visible: false
//                     })
//                   }, 2000);
//                 },
//                 "fail": function (err) {
//                   console.log(err.errMsg);
//                   console.log("返回失败");
//                   that.setData({
//                     onclick: false
//                   })
//                   app.globalData.userInfo = true
//                   that.setData({
//                     localVar: app.globalData.userInfo
//                   })
//                   // console.log(that.data.localVar);
//                 }
//               })
//             }
//           })
//       // success: (res) => {
//       //   if (res.data.success) {
//       //     wx.showToast({
//       //       title: '充值成功',
//       //       icon: 'success'
//       //     });
//       //     // 更新余额并重新格式化
//       //     this.setData({
//       //       balance: (this.data.balance + rechargeAmount).toFixed(2)
//       //     });
//       //   } else {
//       //     wx.showToast({
//       //       title: '充值失败',
//       //       icon: 'none'
//       //     });
//       //   }
//       // },
//       // fail: () => {
//       //   wx.showToast({
//       //     title: '网络错误',
//       //     icon: 'none'
//       //   });
//       // }
//     // });
//   }
// });


const app = getApp();
Page({
  data: {
    tupianUrl: app.globalData.tupianUrl,
    MCODE: '',
    quantity: 1, // 初始数量
    pricePerUnit: '', // 每份价格，单位为元
    userid: app.globalData.userid, // 获取全局userid
    showCodeDialog: false, // 控制弹窗显示
    inputBoxes: ["", "", "", "", "", ""], // 六个输入框
    codeValue: '', // 完整交易码
    testFocus: false, // 隐藏输入框聚焦
    money: '0.00', // 初始化为字符串格式
    score: '0.00', // 初始化为字符串格式
  },

  onLoad(options) {
    this.refreshBalance(); // 初始化时加载余额
  },

  onShow() {
    this.refreshBalance();
    this.loadPriceData();
  },

  // 加载价格数据
  loadPriceData() {
    const AUrl = app.globalData.AUrl;
    wx.request({
      url: `${AUrl}/jy/go/we.aspx?ituid=106&itjid=10641&itcid=10641`,
      success: (res) => {
        this.setData({
          MCODE: res.data.code,
          pricePerUnit: res.data.data,
          showMoney: (res.data.data * 0.6).toFixed(2),
          showQuan: (res.data.data * 0.4).toFixed(2)
        });
      }
    });
  },

  // 刷新余额数据
  refreshBalance() {
    const itsid = wx.getStorageSync('itsid');
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      success: (res) => {
        this.setData({
          money: parseFloat(res.data.money || 0).toFixed(2),
          score: parseFloat(res.data.score || 0).toFixed(2)
        });
      }
    });
  },

  // 显示交易码弹窗
  showCodeDialog() {
    this.setData({
      showCodeDialog: true
    });
  },

  // 关闭弹窗
  closeDialog() {
    this.setData({
      showCodeDialog: false,
      codeValue: '',
      inputBoxes: ["", "", "", "", "", ""]
    });
  },

  handleGetFocus() {
    this.setData({
      testFocus: true
    });
  },

  handleNotFocus() {
    this.setData({
      testFocus: false
    });
  },

  // 处理输入
  handleTestInput(e) {
    const value = e.detail.value;
    const tempList = this.data.inputBoxes;
    for (let i = 0; i < 6; i++) {
      tempList[i] = value[i] ? value[i] : '';
    }
    this.setData({
      inputBoxes: tempList,
      codeValue: value
    });
  },

  // 验证交易码
  getServerTransactionCode() {
    return new Promise((resolve, reject) => {
      const userid = wx.getStorageSync('userid');

      wx.request({
        url: `${app.globalData.AUrl}/jy/go/we.aspx`, // 请确保链接合法且可访问
        method: 'GET',
        data: {
          ituid: 106,
          itjid: 10610,
          itcid: 10632,
          userid: userid
        },
        success: (res) => {
          console.log('交易码接口响应：', res.data);

          // 解析接口响应
          if (res.data.code === "1") {
            // 检查数据结构完整性
            if (res.data.result?.list?.[0]?.transactionCode) {
              const serverCode = res.data.result.list[0].transactionCode;
              if (serverCode.length === 6) {
                resolve(serverCode);
              } else {
                reject(new Error('交易码格式无效（长度不符）'));
              }
            } else {
              reject(new Error('接口返回数据格式异常'));
            }
          } else {
            reject(new Error(res.data.msg || '接口请求失败'));
          }
        },
        fail: (err) => {
          reject(new Error('网络连接失败，请检查网络'));
        }
      });
    });
  },

  // 修改后的验证方法
  verifyCode() {
    const that = this;
    const {
      codeValue
    } = this.data;

    if (!/^\d{6}$/.test(codeValue)) {
      wx.showToast({
        title: '请输入6位数字交易码',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '验证中...',
      mask: true
    });

    this.getServerTransactionCode()
      .then(serverCode => {
        // 安全对比（防止时序攻击）
        const safeCompare = (a, b) => {
          let mismatch = 0;
          const length = Math.max(a.length, b.length);
          for (let i = 0; i < length; ++i) {
            mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
          }
          return mismatch === 0;
        };

        if (safeCompare(codeValue, serverCode)) {
          that.closeDialog();
          that.executePayment(); // 验证成功后调用支付接口
        } else {
          wx.showToast({
            title: '交易码不匹配',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('验证失败:', err);
        wx.showToast({
          title: err.message || '验证失败',
          icon: 'none',
          duration: 2000
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  // 执行支付
  executePayment() {
    const that = this;

    const itsid = wx.getStorageSync('itsid');
    // const totalAmount = this.data.pricePerUnit * this.data.quantity; // 计算总金额
    const pricePerUnit = this.data.pricePerUnit * this.data.quantity // 计算总金额
    const MCODE = this.data.MCODE
    const AUrl = app.globalData.AUrl
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=10633&ituid=${app.globalData.ituid}&itsid=${itsid}`, //股东升级
      data: {
        MCODE: MCODE,
        OPID: '1205',
        UNITID: '1',
        invite: '',
        NUM: that.data.quantity,
        USERID: that.data.userid, // 传递userid
        NOTE: ' ',
        AMT: pricePerUnit, // 将总金额传递给接口
        // RURL: '/subPackages/package/pages/recharge-payResult/recharge-payResult'
      },
      method: 'POST',
      header: {
        'content-type': 'application/json' // 设置请求的header，通常用于指定请求数据的格式
      },
      success: (res) => {
        console.log("mbid=10602:", res);
        // wx.navigateTo({
        //   url: `/subPackages/package/pages/recharge-pay/recharge-pay?return_url=${res.data.rurl}&orderid=${res.data.orderid}&terminal=${res.data.terminal_sn}&amt=${res.data.AMT}&sign=${res.data.sign}`,
        // })

        wx.showToast({
          title: '升级成功',
          duration: 2000
        });
        wx.request({
          url: `${AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
          method: 'GET',
          success: (res) => {
            that.setData({
              money: res.data.money || '0',
              score: res.data.score || '0',
            });
          },
          fail: (error) => {
            console.error('获取数据失败', error);
          }
        });
        // 发起微信支付
        // wx.requestPayment({
        //   "timeStamp": res.data.timeStamp, // 时间戳
        //   "nonceStr": res.data.nonceStr, // 随机字符串
        //   "package": res.data.package, // 统一下单接口返回的prepay_id参数值，格式为prepay_id=***
        //   "signType": res.data.signType, // 签名算法，应与后台下单时的值一致
        //   "paySign": res.data.paySign, // 签名，具体见微信支付文档
        //   success: function (res) {
        //     wx.showToast({
        //       title: '支付成功',
        //       duration: 2000
        //     });
        //     setTimeout(() => {
        //       that.setData({
        //         visible: false
        //       });
        //     }, 2000);
        //   },
        //   fail: function (err) {
        //     console.log(err.errMsg);
        //     console.log("支付失败");
        //     that.setData({
        //       onclick: false
        //     });
        //     app.globalData.userInfo = true;
        //     that.setData({
        //       localVar: app.globalData.userInfo
        //     });
        //   }
        // });
      },
      fail: (err) => {
        console.error('支付接口调用失败:', err);
        wx.showToast({
          title: '支付失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 其他方法保持不变
  onDecrease: function () {
    let newQuantity = this.data.quantity - 1;
    if (newQuantity < 1) newQuantity = 1;
    this.setData({
      quantity: newQuantity
    });
    this.setData({
      showMoney: newQuantity * this.data.pricePerUnit * 6 / 10,
      showQuan: newQuantity * this.data.pricePerUnit * 4 / 10,
    })
  },

  onIncrease: function () {
    let newQuantity = this.data.quantity + 1;
    this.setData({
      quantity: newQuantity
    });
    this.setData({
      showMoney: newQuantity * this.data.pricePerUnit * 6 / 10,
      showQuan: newQuantity * this.data.pricePerUnit * 4 / 10,
    })
  },


  confirmChange: function () {
    let that = this;
    // const invite1 = wx.getStorageSync('invite');
    console.log('提交的推荐码:', this.data.inviteCode); // 调试日志
    const inviteCode = this.data.inviteCode
    // console.log('邀请人ID:', invite1);
    const itsid = wx.getStorageSync('itsid');

    const pricePerUnit = this.data.pricePerUnit * this.data.quantity * 0.6; // 计算总金额
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=10634&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      data: {
        MCODE: 920, // 动态设置MCODE
        OPID: '1207',
        UNITID: '1',
        NUM: that.data.quantity,
        USERID: '0',
        NOTE: ' ',
        // AMT: cashAmount,
        AMT: pricePerUnit,
        // invite: inviteCode,
        RURL: '/subPackages/package/pages/shareholder-payResult/shareholder-payResult'
      },
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log(res)
        wx.navigateTo({
          url: `/subPackages/package/pages/shareholder-pay/shareholder-pay?return_url=${res.data.rurl}&orderid=${res.data.orderid}&terminal=${res.data.terminal_sn}&amt=${res.data.AMT}&sign=${res.data.sign}`,
        })
      }
    });




  },
  onRecharge: function () {
    if (!this.checkUpgradeBalance()) return;
    this.showCodeDialog(); // 先显示交易码弹窗
  },
  // 专用升级余额检查方法
  checkUpgradeBalance() {
    const cashNeeded = parseFloat(this.data.showMoney);
    const couponNeeded = parseFloat(this.data.showQuan);
    const currentCash = parseFloat(this.data.money);
    const currentCoupon = parseFloat(this.data.score);

    // 现金检查
    if (currentCash < cashNeeded) {
      wx.showToast({
        title: `升级金额不足`,
        icon: 'none'
      });
      return false;
    }

    // 消费券检查
    if (currentCoupon < couponNeeded) {
      wx.showToast({
        title: `升级消费券不足`,
        icon: 'none'
      });
      return false;
    }

    return true;
  },
});