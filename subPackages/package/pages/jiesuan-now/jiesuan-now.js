const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    address: '',
    selected: '自提', // 默认选择自提
    storeName: '',
    phone: '',
    username: '',
    items: [], // 用于存储商品信息的数组
    usePoints: false, // 是否使用积分支付，默认不勾选
    useCoupon: false, // 是否使用卡券支付
    couponAvailable: false, // 卡券是否可用
    delivery: 5,
    couponId: '',
    showCodeDialog: false, // 控制弹窗显示
    inputBoxes: ["", "", "", "", "", ""], // 六个输入框
    codeValue: '', // 完整交易码
    testFocus: false, // 隐藏输入框聚焦
    AUrl: app.globalData.AUrl,
    tupianUrl: app.globalData.tupianUrl,
    isShow: true,
    userScore: 0, // 当前用户积分
    requiredScore: 0, // 本次支付需要积分
    pointsAvailable: false, // 消费券是否可用
    totalPrice: 0, // 总价格
    totalCount: 0, // 商品总数量
    remark: '', // 备注
  },

  // 启动支付流程
  initiatePayment() {
    this.setData({
      isShow: false
    })
    wx.showToast({
      title: '加载中',
      icon: 'loading',
      mask: true
    })
    console.log('点击付款，当前支付方式：', {
      useCoupon: this.data.useCoupon,
      usePoints: this.data.usePoints
    });

    if (this.data.useCoupon || this.data.usePoints) {
      this.showCodeDialog();
    } else {
      // 现金支付无需验证交易码
      this.cashPayment();
      }
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

  // 输入框获取焦点
  handleGetFocus() {
    this.setData({
      testFocus: true
    });
  },

  // 输入框失去焦点
  handleNotFocus() {
    this.setData({
      testFocus: false
    });
  },

  // 处理输入的交易码
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

  // 获取交易码 - 需要实现
  // TODO: 实现获取交易码的接口调用
  getServerTransactionCode() {
    return new Promise((resolve, reject) => {
      const userid = wx.getStorageSync('userid');
      // 接口调用示例
      wx.request({
        url: `${app.globalData.AUrl}/jy/go/we.aspx`,
        method: 'GET',
        data: {
          ituid: 106,
          itjid: 10610,
          itcid: 10632,
          userid: userid
        },
        success: (res) => {
          console.log('交易码接口响应：', res.data);
          if (res.data.code === "1") {
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

  // 验证交易码
  async verifyCode() {
    try {
      const inputCode = this.data.codeValue.trim();
      if (inputCode.length !== 6) {
        wx.showToast({
          title: '请输入6位交易码',
          icon: 'none'
        });
        return;
      }

      const serverCode = await this.getServerTransactionCode();
      if (inputCode === serverCode) {
        wx.showToast({
          title: '交易码验证成功'
        });
        this.closeDialog();
        // 根据支付方式分别调用对应接口
        if (this.data.useCoupon) {
          this.couponPayment();
        } else if (this.data.usePoints) {
          this.doPayment(); // 积分支付流程
        }
      } else {
        wx.showToast({
          title: '交易码错误，请重新输入',
          icon: 'none'
        });
        this.setData({
          codeValue: '',
          inputBoxes: ["", "", "", "", "", ""]
        });
      }
    } catch (error) {
      wx.showToast({
        title: error.message,
        icon: 'none'
      });
    }
  },

  // 跳转到选择地址页面
  gotoChooseLocation() {
    wx.navigateTo({
      url: '/subPackages/package/pages/chooseLocation/chooseLocation?type=jiesuan-now',
    })
  },

  // 选择配送方式
  selectOption: function (e) {
    const option = e.currentTarget.dataset.option;
    app.globalData.selected = option;
    if (option === '自提') {
      app.globalData.address = app.globalData.storeName;
    } else if (option === '外送') {
      // 根据地址设置对应的外送门店ID
      // 这里默认使用恒明店号6，可根据实际地址判断使用6还是8
      const deliveryUnitId = '6'; // 默认恒明店号
      wx.setStorageSync('deliveryUnitId', deliveryUnitId);
      app.globalData.deliveryUnitId = deliveryUnitId;
    }
    this.setData({
      selected: option,
      address: app.globalData.address
    }, () => {
      // 重新计算总价
      this.calculateTotal();
    });
  },

  // 备注输入处理
  inputRemark(e) {
    this.setData({
      remark: e.detail.value
    });
  },

  // 卡券选择处理
  couponCheckboxChange: function (e) {
    let useCoupon = e.detail.value.includes('卡券支付');

    // 强制校验卡券可用性
    if (useCoupon) {
      this.fetchCoupons(); // 获取卡券列表
      if (!this.data.couponAvailable) {
        wx.showToast({
          title: '当前订单不符合卡券使用条件',
          icon: 'none'
        });
        useCoupon = false; // 强制取消勾选状态
      }
    } else {
      this.setData({
        useCoupon: false
      });
    }

    // 与积分支付互斥
    if (useCoupon && this.data.usePoints) {
      this.setData({
        usePoints: false
      });
    }

    this.setData({
      useCoupon
    }); // 更新最终状态
  },

  // 积分支付选择处理
  checkboxChange: function (e) {
    let usePoints = e.detail.value.includes('积分支付');

    // 检查积分是否足够
    if (usePoints) {
      // 调用检查积分可用性方法
      this.fetchUserScores();
    } else {
      this.setData({
        usePoints: false
      });
    }

    // 与卡券支付互斥
    if (usePoints && this.data.useCoupon) {
      this.setData({
        useCoupon: false
      });
    }

    this.setData({
      usePoints
    });
  },

  // 检查积分可用性 - 需要实现
  // TODO: 实现积分检查接口调用
  fetchUserScores: function () {
    const that = this;
    const itsid = wx.getStorageSync('itsid');

    console.log('消费券查询参数:', { itsid });

    // 示例接口调用
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        console.log('消费券接口返回:', res.data);

        // 检查返回的数据是否包含score字段
        if (res.data && typeof res.data.score !== 'undefined') {
          const score = parseInt(res.data.score || 0, 10);
          const requiredScore = Math.ceil(that.data.totalPrice * 1.6);

          console.log('消费券数据:', { score, requiredScore, isEnough: score >= requiredScore });

          that.setData({
            userScore: score,
            requiredScore: requiredScore,
            pointsAvailable: score >= requiredScore
          });

          // 检查是否有足够的消费券
          if (score < requiredScore) {
            wx.showToast({
              title: '当前消费券不足',
              icon: 'none',
              duration: 2000
            });

            // 强制取消勾选状态
            that.setData({
              usePoints: false
            });
          }
        } else {
          console.error('消费券接口返回数据格式异常:', res.data);
          that.getUserScoreForCheck();
        }
      },
      fail: (err) => {
        console.error('获取消费券信息失败:', err);
        that.getUserScoreForCheck();
      }
    });
  },

  // 备用获取积分方法 - 需要实现
  getUserScoreForCheck: function () {
    const that = this;
    const itsid = wx.getStorageSync('itsid');

    // 备用方法示例
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      success(res) {
        console.log('备用积分接口返回:', res.data);

        if (res.data && res.data.code === '1') {
          const score = parseInt(res.data.score || 0, 10);
          const requiredScore = Math.ceil(that.data.totalPrice * 1.6);

          that.setData({
            userScore: score,
            requiredScore: requiredScore,
            pointsAvailable: score >= requiredScore
          });

          if (score < requiredScore) {
            wx.showToast({
              title: '当前消费券不足',
              icon: 'none',
              duration: 2000
            });
            that.setData({
              usePoints: false
            });
          }
        } else {
          wx.showToast({
            title: '当前无可用消费券',
            icon: 'none',
            duration: 2000
          });
          that.setData({
            usePoints: false
          });
        }
      },
      fail() {
        wx.showToast({
          title: '当前无可用消费券',
          icon: 'none',
          duration: 2000
        });
        that.setData({
          usePoints: false
        });
      }
    });
  },

  // 页面加载时执行
  onLoad: function (options) {
    // 加载立即购买的商品信息
    const buyNowItems = wx.getStorageSync('buyNowItems') || [];

    if (buyNowItems.length > 0) {
      // 计算总价和总数量
      const totalPrice = buyNowItems.reduce((total, item) => {
        return total + (item.price * item.num);
      }, 0);

      const totalCount = buyNowItems.reduce((count, item) => {
        return count + item.num;
      }, 0);

      this.setData({
        items: buyNowItems,
        totalPrice: totalPrice,
        totalCount: totalCount
      });
    }

    // 获取用户信息 - 包括自提门店、送货地址等
    this.loadUserInfo();
  },

  // 加载用户信息 - 需要实现
  loadUserInfo() {
    // 从全局获取基本信息
    this.setData({
      selected: app.globalData.selected || '自提',
      address: app.globalData.address || '',
      phone: app.globalData.phone || '',
      username: app.globalData.username || '',
      storeName: app.globalData.selectedStoreName || '',
    });
  },

  // 页面显示时执行
  onShow: function () {
    // 更新全局相关信息
    this.setData({
      isShow: true,
      selected: app.globalData.selected,
      address: app.globalData.selected === '外送' ? app.globalData.addressDesc : app.globalData.storeName,
      phone: app.globalData.phone,
      username: app.globalData.username,
      storeName: app.globalData.selectedStoreName,
      delivery: app.globalData.delivery || 5
    }, () => {
      // 重新计算总价
      this.calculateTotal();
      // 获取用户积分
      this.getUserScore();
    });
  },

  // 获取用户积分
  getUserScore() {
    const that = this;
    const itsid = wx.getStorageSync('itsid');
    // 接口调用示例
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      success(res) {
        if (res.data.code === '1') {
          const score = parseInt(res.data.score || 0, 10);
          that.setData({
            userScore: score,
            requiredScore: Math.ceil(that.data.totalPrice * 1.6) // 计算所需积分
          });
        }
      }
    });
  },

  // 计算总价
  calculateTotal: function () {
    let total = this.data.items.reduce((sum, item) => {
      const quantity = Number(item.num) || 0;
      const price = Number(item.price) || 0;
      return sum + (quantity * price);
    }, 0);

    // 如果选择外送，则加上配送费
    if (this.data.selected === '外送') {
      total += Number(this.data.delivery);
    }

    this.setData({
      totalPrice: total.toFixed(2)
    });
  },

  // TODO: 实现获取卡券列表接口
  fetchCoupons() {
    const that = this;
    const userid = wx.getStorageSync('userid');
    // 接口调用示例
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=0902&itcid=10619&userid=${userid}`,
      method: 'GET',
      success: (res) => {
        console.log('原始卡券数据:', res.data.result);
        if (res.data.result && res.data.result.length > 0) {
          // 此处默认使用第一个可用卡券
          that.setData({
            cardid: res.data.result[0].cardid || res.data.result[0].id,
            couponAvailable: true,
            useCoupon: true
          });
        } else {
          that.setData({
            couponAvailable: false,
            useCoupon: false
          });
          wx.showToast({
            title: '当前订单无可用卡券',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('获取卡券请求失败', err);
      }
    });
  },

  // 处理支付结果
  handlePaymentResult(res, type) {
    const msg = {
      coupon: {
        success: '卡券支付成功',
        fail: '卡券支付失败'
      },
      points: {
        success: '积分支付成功',
        fail: '积分支付失败'
      },
      cash: {
        success: '支付成功',
        fail: '支付失败'
      }
    }[type];

    if (res.data.code === '1') {
      // 清除立即购买的缓存数据
      wx.removeStorageSync('buyNowItems');

      wx.showToast({
        title: msg.success,
        icon: 'success'
      });
      setTimeout(() => wx.switchTab({
        url: '/pages/orders/orders'
      }), 2000);
    } else {
      wx.showToast({
        title: res.data.msg || msg.fail,
        icon: 'none'
      });
    }
  },

  // 积分支付流程
  doPayment() {
    // 获取用户积分数据后处理支付
    const itsid = wx.getStorageSync('itsid');
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        console.log('积分接口返回数据:', res.data);
        const score = res.data.score ? res.data.score : 0;
        console.log('用户当前积分为:', score);
        app.globalData.score = parseInt(score, 10);
        this.processPayment(score);
      },
      fail: (err) => {
        console.log('积分接口调用失败:', err);
        wx.showToast({
          title: '获取积分失败，请重试',
          icon: 'none',
          duration: 3000
        });
      }
    });
  },

  // 处理支付逻辑
  processPayment(score) {
    // TODO: 实现立即购买的积分支付处理
    const itsid = wx.getStorageSync('itsid');
    let totalAmount = parseFloat(this.data.totalPrice) || 0;
    const usePoints = this.data.usePoints;
    
    // 修改：统一unitId的获取逻辑
    let unitId;
    if (this.data.selected === '自提') {
      unitId = wx.getStorageSync('selectedStoreId');
    } else {
      // 外送时，优先使用存储中的deliveryUnitId，如果没有则使用app.globalData中的，如果也没有则使用默认值
      unitId = wx.getStorageSync('deliveryUnitId') || app.globalData.deliveryUnitId || '2'; // 默认外送门店ID为2
    }

    // 如果是外送，总金额加上配送费
    if (this.data.selected === '外送') {
      totalAmount += this.data.delivery;
    }

    // 积分支付逻辑
    if (this.data.usePoints) {
      const requiredPoints = totalAmount * 1.6;
      console.log('Required Points:', requiredPoints);

      // 检查积分是否足够
      if (score >= requiredPoints) {
        console.log('积分足够，扣除积分');

        if (this.data.useCoupon && this.data.couponAvailable) {
          this.couponPayment(); // 独立卡券支付流程
          return;
        }

        // 获取商品信息，用于提交MCODE和NUM
        const item = this.data.items[0]; // 假设立即购买只有一个商品
        const mcode = item.skuCode || ''; // 商品编码
        const num = item.num || 1; // 商品数量

        // 积分支付接口调用 - 需要实现
        wx.request({
          url: `${app.globalData.backUrl}phone.aspx?mbid=10643&ituid=${app.globalData.ituid}&itsid=${itsid}`,
          method: 'POST',
          data: {
            MCODE: mcode,//商品编码
            OPID: '1203',
            UNITID: this.data.selected === '自提' ? unitId : '',
            NUM: num,//商品数量
            USERID: '0',
            NOTE: '积分支付 - 立即购买',
            SCORE: requiredPoints,
            AMT: 0,
            ASK: item.ask,
            type: this.data.selected === '自提' ? 1 : 2,
            username: this.data.username,
            phone: this.data.phone,
            address: this.data.address,
            extra: JSON.stringify({ 
              in_lite_app: true,
              specs: this.data.selectedSpecs
            })
          },
          header: {
            'content-type': 'application/json'
          },
          success: (res) => {
            wx.showToast({
              title: '积分支付成功',
              duration: 2000
            });

            // 移除立即购买缓存
            wx.removeStorageSync('buyNowItems');

            // 更新用户积分
            this.updateUserScore();

            // 支付成功后跳转到订单页面
            wx.switchTab({
              url: '/pages/orders/orders'
            });
          },
          fail: (err) => {
            console.log('微信支付接口调用失败:', err);
            wx.showToast({
              title: '支付失败，请重试',
              icon: 'none',
              duration: 3000
            });
          }
        });
      } else {
        console.log('积分不足');
        wx.showToast({
          title: '积分不足，请选择现金支付或充值积分',
          icon: 'none',
          duration: 3000
        });

        // 强制勾选现金支付
        this.setData({
          usePoints: false
        });

        // 调用现金支付逻辑
        this.cashPayment();
      }
    } else {
      console.log('使用现金支付');
      this.cashPayment();
    }
  },

  // 更新用户积分 - 支付后调用
  updateUserScore() {
    const itsid = wx.getStorageSync('itsid');
    // 重新获取积分
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        const newScore = res.data.score ? res.data.score : 0;
        console.log('新的积分:', newScore);
        app.globalData.score = parseInt(newScore, 10);
      }
    });
  },

  // 现金支付流程 - 需要实现
  cashPayment() {
    // TODO: 实现立即购买的现金支付处理
    const itsid = wx.getStorageSync('itsid');
    const app = getApp();
    
    // 修改：统一获取unitId的逻辑，并添加默认外送门店ID
    let unitId;
    if (this.data.selected === '自提') {
      unitId = wx.getStorageSync('selectedStoreId');
    } else {
      // 外送时，优先使用存储中的deliveryUnitId，如果没有则使用app.globalData中的，如果也没有则使用默认值
      unitId = wx.getStorageSync('deliveryUnitId') || app.globalData.deliveryUnitId || '2'; // 默认外送门店ID为2
    }
    
    let totalAmount = parseFloat(this.data.totalPrice);

    if (this.data.selected === '自提' && !unitId) {
      wx.showToast({
        title: '请选择门店',
        duration: 2000
      });
      return;
    }

    if (this.data.selected === '外送') {
      totalAmount += this.data.delivery;
    }
    
    console.log('支付模式:', this.data.selected);
    console.log('使用的门店ID:', unitId);
    console.log('计算后的总金额（含配送费）:', totalAmount);

    // 获取商品信息，用于提交MCODE和NUM
    const item = this.data.items[0]; // 假设立即购买只有一个商品
    const mcode = item.skuCode || ''; // 商品编码
    const num = item.num || 1; // 商品数量

    //现金支付接口
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=10642&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      method: 'POST',
      data: {
          MCODE: mcode,//商品编码
          OPID: '1200',
          UNITID: unitId,
          NUM: num,
          USERID: '0',
          NOTE: '立即购买现金',
          ASK: item.ask, // 添加规格数据
          AMT: totalAmount,
          XXSQ: 'SQB',
          RURL: '/subPackages/package/pages/jiesuan-payResult/jiesuan-payResult',
          type: this.data.selected === '自提' ? 1 : 2,
          username: this.data.username,
          phone: this.data.phone,
          address: this.data.address,
          extra: JSON.stringify({ 
            in_lite_app: true,
            specs: this.data.selectedSpecs
          })
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        wx.hideToast();
        console.log('支付接口返回:', res);

        let packageNew = encodeURIComponent(res.data.yeepay.package)
        let paySignNew = encodeURIComponent(res.data.yeepay.paySign)

        console.log("packageNew:", packageNew);
        console.log("paySignNew:", paySignNew);

        // 移除立即购买缓存
        wx.removeStorageSync('buyNowItems');

        if (!this.data.usePoints && !this.data.useCoupon) {
          wx.navigateTo({
            url: `/subPackages/package/pages/jiesuan-pay/jiesuan-pay?return_url=${res.data.rurl}&orderid=${res.data.orderid}&terminal=${res.data.terminal_sn}&amt=${res.data.AMT}&sign=${res.data.sign}&appId=${res.data.yeepay.appId}&nonceStr=${res.data.yeepay.nonceStr}&package=${packageNew}&paySign=${paySignNew}&signType=${res.data.yeepay.signType}&timeStamp=${res.data.yeepay.timeStamp}&SN=${res.data.SN}`,
          });
        }
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

  // 卡券支付流程 - 需要实现
  couponPayment() {
    // TODO: 实现立即购买的卡券支付处理
    const itsid = wx.getStorageSync('itsid');
    const userid = wx.getStorageSync('userid');
    const total = parseFloat(this.data.totalPrice) +
      (this.data.selected === '外送' ? this.data.delivery : 0);
    
    // 修改：统一unitId的获取逻辑
    let unitId;
    if (this.data.selected === '自提') {
      unitId = wx.getStorageSync('selectedStoreId');
    } else {
      // 外送时，优先使用存储中的deliveryUnitId，如果没有则使用app.globalData中的，如果也没有则使用默认值
      unitId = wx.getStorageSync('deliveryUnitId') || app.globalData.deliveryUnitId || '2'; // 默认外送门店ID为2
    }
    
    console.log('支付模式:', this.data.selected);
    console.log('使用的门店ID:', unitId);
    console.log('计算后的总金额（含配送费）:', total);

    // 获取商品信息，用于提交MCODE和NUM
    const item = this.data.items[0]; // 假设立即购买只有一个商品
    const mcode = item.skuCode || ''; // 商品编码
    const num = item.num || 1; // 商品数量

    //卡券支付
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=10644&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      method: 'POST',
      data: {
        MCODE: 'mcode',
        OPID: '1204',
        UNITID: unitId,
        NOTE: '立即购买-卡券支付',
        NUM: 'num',
        USERID: userid,
        cardid: this.data.cardid,
        AMT: 0,
        ASK: item.ask,
        type: this.data.selected === '自提' ? 1 : 2,
        username: this.data.username,
        phone: this.data.phone,
        address: this.data.address,
        extra: JSON.stringify({ 
          in_lite_app: true,
          specs: this.data.selectedSpecs
        })
      },
      success: (res) => {
        this.handlePaymentResult(res, 'coupon');
        // 移除立即购买缓存
        wx.removeStorageSync('buyNowItems');
      },
      fail: (err) => {
        console.error('卡券支付接口调用失败:', err);
        wx.showToast({
          title: '支付失败，请重试',
          icon: 'none'
        });
      }
    });
  }
})
