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
    usePoints: false, // 新增：是否使用积分支付，默认bu勾选
    useCoupon: false, // 新增：是否使用卡券支付
    couponAvailable: false, // 新增：卡券是否可用
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
    pointsAvailable: false, // 新增：消费券是否可用
    // 新增：统一支付方式与余额展示
    payMethod: 'wechat', // wechat | balance | coffee | deposit
    pendingPayMethod: '',
    funds: { balance: 0, coffee: 0, deposit: 0 },
    balanceDisabled: true,
    coffeeDisabled: true,
    depositDisabled: true,
    selectedCouponText: '',
    // 新增：取餐方式（自提内部分：店内用餐/自提带走）
    dineType: 'dine_in' // dine_in | takeaway
  },
  initiatePayment() {
    const method = this.data.payMethod || 'wechat';
    const payable = Number(this.data.payableAmount || this.data.totalprice || 0);
    if (method === 'wechat') {
      this.cashPayment();
      return;
    }
    if (method === 'balance' && Number(this.data.funds.balance || 0) < payable) {
      wx.showToast({ title: '余额不足抵扣', icon: 'none' });
      return;
    }
    if (method === 'coffee' && Number(this.data.funds.coffee || 0) < payable) {
      wx.showToast({ title: '咖啡券不足抵扣', icon: 'none' });
      return;
    }
    if (method === 'deposit' && Number(this.data.funds.deposit || 0) < payable) {
      wx.showToast({ title: '储值卡不足抵扣', icon: 'none' });
      return;
    }
    this.setData({ pendingPayMethod: method });
    this.showCodeDialog();
  },
  executePayByMethod(method) {
    if (method === 'coffee') {
      this.coffeeWalletPayment();
      return;
    }
    if (method === 'balance') {
      this.balancePayment();
      return;
    }
    if (method === 'deposit') {
      this.depositPayment();
      return;
    }
    this.cashPayment();
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

  // 验证交易码，只有验证成功后再调用支付接口
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
        this.executePayByMethod(this.data.pendingPayMethod || this.data.payMethod);
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
  gotoChooseLocation() {
    wx.navigateTo({
      url: '/subPackages/package/pages/chooseLocation/chooseLocation?type=jiesuan',
    })
  },
  // jiesuan页面selectOption函数
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
      address: option === '外送' ? (app.globalData.addressDesc || '') : (app.globalData.storeName || '')
    }, () => {
      // 重新加载商品数据，并计算总价
      this.fetchItems();
      // 自动选择优惠券并重算实付
      this.fetchCoupons();
      this.recomputePayable();
    });
  },

  fetchItems: function () {
    const that = this;
    const itsid = wx.getStorageSync('itsid');
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10601&itsid=${itsid}`,
      method: 'GET',
      success(res) {
        if (res.data.code === '1' && res.data.result) {
          const items = res.data.result.list;
          const hasValidItem = items.some(item =>
            item.title.includes('冰美式') && Number(item.num) === 1
          );

          // 强制更新卡券状态
          that.setData({
            items: items,
            couponAvailable: hasValidItem,
            useCoupon: hasValidItem ? that.data.useCoupon : false // 无有效商品时强制关闭
          }, () => {
            that.calculateTotal();
          });
        }
      }
    });
  },
  // 新增卡券选择处理
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
      // else {
      //   this.fetchCoupons(); // 获取卡券列表
      // }
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
      // 调用检查消费券可用性方法
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

  // 新增：检查消费券可用性
  fetchUserScores: function() {
    const that = this;
    const itsid = wx.getStorageSync('itsid');
    const userid = wx.getStorageSync('userid');
    
    console.log('消费券查询参数:', {userid, itsid});
    
    // 恢复使用原始接口格式，使用itsid参数
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        console.log('消费券接口返回:', res.data);
        
        // 检查返回的数据是否包含score字段
        if (res.data && typeof res.data.score !== 'undefined') {
          const score = parseInt(res.data.score || 0, 10);
          const requiredScore = Math.ceil(that.data.totalprice * 1.6);
          
          console.log('消费券数据:', {score, requiredScore, isEnough: score >= requiredScore});
          
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
          
          // 尝试从getUserScore方法获取积分
          that.getUserScoreForCheck();
        }
      },
      fail: (err) => {
        console.error('获取消费券信息失败:', err);
        
        // 尝试从getUserScore方法获取积分
        that.getUserScoreForCheck();
      }
    });
  },
  
  // 新增：备用获取积分方法
  getUserScoreForCheck: function() {
    const that = this;
    const itsid = wx.getStorageSync('itsid');
    
    // 尝试使用onShow中相同的方法获取积分
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      success(res) {
        console.log('备用积分接口返回:', res.data);
        
        if (res.data && res.data.code === '1') {
          const score = parseInt(res.data.score || 0, 10);
          const requiredScore = Math.ceil(that.data.totalprice * 1.6);
          
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
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    const itsid = wx.getStorageSync('itsid');
    this.fetchItems();
    this.setData({
      client_sn: Date.now(),
    });
  },
  navigateTo: function (e) {
    wx.redirectTo({
      url: e.detail.url,
      fail(e) {
        console.log(e);
      },
    });
  },
  // gopay() {
  //   let that = this;
  //   const itsid = wx.getStorageSync('itsid')
  //   // 检查是否使用积分支付
  //   if (this.data.usePoints) {
  //     // 使用积分支付
  //     console.log("使用积分支付");
  //   } else {

  //     console.log("不使用积分支付");
  //   }
  //   wx.request({
  //     url: `${app.globalData.backUrl}phone.aspx?mbid=122&ituid=${app.globalData.ituid}&itsid=${itsid}`,
  //     data: {
  //       MCODE: '',
  //       OPID: '1200',
  //       UNITID: '2',
  //       NUM: '',
  //       USERID: '0',
  //       NOTE: ' ',
  //       AMT: 0
  //     },
  //     method: 'POST',
  //     header: {
  //       'content-type': 'application/json' // 设置请求的header，通常用于指定请求数据的格式
  //     },
  //     success: (res) => {
  //       console.log("mbid=121:", res)
  //       wx.showToast({
  //         title: '支付成功',
  //         duration: 2000
  //       })
  //       that.setData({
  //         visible: false
  //       })

  //       wx.requestPayment({
  //         "timeStamp": res.data.timeStamp, //时间戳
  //         "nonceStr": res.data.nonceStr, //随机字符串
  //         "package": res.data.package, //统一下单接口返回的prepay_id参数值，格式为prepay_id=***
  //         "signType": res.data.signType, //签名算法，应与后台下单时的值一致
  //         "paySign": res.data.paySign, //签名，具体见微信支付文档
  //         "totalFee": 1, //支付金额
  //         "success": function (res) {
  //           wx.showToast({
  //             title: '支付成功',
  //             duration: 2000
  //           })

  //           setTimeout(() => {
  //             that.setData({
  //               visible: false
  //             })
  //           }, 2000);

  //         },
  //         "fail": function (err) {
  //           console.log(err.errMsg);
  //           console.log("返回失败");
  //           that.setData({
  //             onclick: false
  //           })
  //           app.globalData.userInfo = true
  //           //             that.setData({
  //           //               localVar: app.globalData.userInfo
  //           //             })
  //           // console.log(that.data.localVar);
  //         }
  //       })
  //     }
  //   })
  //   wx.request({
  //     url: 'https://www.ruanzi.net/jy/go/we.aspx?ituid=106&itjid=5035&itcid=5035&id=01 ',
  //     method: 'GET',
  //     success: function (res) {
  //       if (res.data.code === '1' && res.data.result) {
  //         wx.setStorageSync('categories', res.data.result.goods)
  //         wx.setStorageSync('total', 0)
  //       } else {
  //         wx.showToast({
  //           title: '数据加载失败',
  //           icon: 'none',
  //           duration: 2000
  //         });
  //       }
  //     },
  //   })
  //   wx.switchTab({
  //     url: '/pages/orders/orders',
  //   })
  // },
  doPayment() {
    // 此处不再显示交易码弹窗，支付流程直接开始
    let that = this;
    const itsid = wx.getStorageSync('itsid');
    const app = getApp();
    let totalAmount = parseFloat(this.data.totalprice) || 0;
    const usePoints = this.data.usePoints;

    console.log('Total Price:', this.data.totalprice);
    console.log('Use Points:', usePoints);

    // 获取用户积分数据
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        console.log('积分接口返回数据:', res.data);
        const score = res.data.score ? res.data.score : 0;
        console.log('用户当前积分为:', score);
        app.globalData.score = parseInt(score, 10);
        that.processPayment(score);
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
  processPayment(score) {
    const itsid = wx.getStorageSync('itsid');
    const app = getApp(); // 获取全局 App 实例
    let totalAmount = parseFloat(this.data.totalprice) || 0;
    const usePoints = this.data.usePoints; // 是否使用积分支付
    
    // 修改：统一unitId的获取逻辑
    let unitId;
    if (this.data.selected === '自提') {
      unitId = wx.getStorageSync('selectedStoreId');
    } else {
      // 外送时，优先使用存储中的deliveryUnitId，如果没有则使用app.globalData中的，如果也没有则使用默认值
      unitId = wx.getStorageSync('deliveryUnitId') || app.globalData.deliveryUnitId || '2'; // 默认外送门店ID为2
    }
    
    console.log('Total Price:', this.data.totalprice);
    console.log('Use Points:', usePoints);
    // 如果是外送，总金额加上配送费
    if (this.data.selected === '外送') {
      totalAmount += this.data.delivery;
    }
    console.log('计算后的总金额（含配送费）:', totalAmount);
    // 积分支付逻辑
    if (this.data.usePoints) {
      const requiredPoints = totalAmount * 1.6; // 包含 delivery
      console.log('Required Points:', requiredPoints);

      // 检查积分是否足够
      if (score >= requiredPoints) {
        console.log('积分足够，扣除积分');

        if (this.data.useCoupon && this.data.couponAvailable) {
          this.couponPayment(); // 独立卡券支付流程
          return; // 直接返回不执行原有流程
        }

        // 调用微信支付接口（金额为0，可能需要特殊处理）
        wx.request({
          url: `${app.globalData.backUrl}phone.aspx?mbid=124&ituid=${app.globalData.ituid}&itsid=${itsid}`,
          method: 'POST',
          data: {
            MCODE: '',
            OPID: '1203',
            UNITID: this.data.selected === '自提' ? unitId : '',
            NUM: '',
            USERID: '0',
            NOTE: '积分支付',
            SCORE: requiredPoints, // 新增积分参数
            AMT: 0,
            extra: JSON.stringify({in_lite_app: true})
            // IMGS: JSON.stringify(this.data.items.map(item => item.img))
          },
          header: {
            'content-type': 'application/json'
          },
          success: (res) => {
            console.log("mbid=121:", res);
            wx.showToast({
              title: '积分支付成功',
              duration: 2000
            });
            // 清空购物车数据
            const categories = wx.getStorageSync('categories') || [];
            categories.forEach(category => {
              if (category.children) {
                category.children.forEach(item => {
                  item.num = 0;
                });
              }
            });

            // 更新存储和全局数据
            wx.setStorageSync('updataArray', [])
            wx.setStorageSync('categories', categories);
            console.log('清空后的存储数据:', wx.getStorageSync('categories'));
            wx.setStorageSync('sum', 0);
            wx.setStorageSync('total', 0);
            getApp().globalData.categories = categories;

            // 强制刷新点单页面
            const pages = getCurrentPages(); // 正确获取页面栈
            const diandanPage = pages.find(page =>
              page.route === '/subPackages/package/pages/diandan/diandan'
            );
            if (diandanPage) {
              diandanPage.setData({
                categories: categories,
                sum: 0,
                totalprice: 0,
                quantity: 1 // 重置数量
              });
            }

            // --------------------------------------------------------------------------------------------------

            // --------------------------------------------------------------------------------------------------
            // 重新获取积分数据
            wx.request({
              url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
              method: 'GET',
              success: (res) => {
                const newScore = res.data.score ? res.data.score : 0;
                console.log('新的积分:', newScore); // 打印新的积分值
                app.globalData.score = parseInt(newScore, 10);

                // 支付成功后跳转到订单页面
                const userid = wx.getStorageSync('userid')
                let that = this
                console.log(userid);
                wx.request({
                  url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10622&userid=${userid}`,
                  success(res) {
                    const orderid = res.data.result.list[0].orderid
                    wx.request({
                      url: `${app.globalData.AUrl}/jy/go/phone.aspx?mbid=10617&ituid=106&itsid=${itsid}`,
                      method: 'POST',
                      data: {
                        orderid: String(orderid),
                        type: that.data.selected === '自提' ? 1 : 2,
                        username: that.data.username,
                        phone: that.data.phone,
                        address: that.data.address
                      },
                      success() {
                        console.log('F31 success!');

                        wx.switchTab({
                          url: `/pages/orders/orders`,
                        });

                        // 加载商品数据
                        wx.request({
                          url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=5035&itcid=5035&id=01 `,
                          method: 'GET',
                          success: function (res) {
                            if (res.data.code === '1' && res.data.result) {
                              wx.setStorageSync('categories', res.data.result.goods)
                              wx.setStorageSync('total', 0)
                            } else {
                              wx.showToast({
                                title: '数据加载失败',
                                icon: 'none',
                                duration: 2000
                              });
                            }
                          },
                        });
                      }
                    })
                  }
                })
              },
              fail: (err) => {
                console.log('重新获取积分失败:', err);
                wx.showToast({
                  title: '重新获取积分失败，请重试',
                  icon: 'none',
                  duration: 3000
                });
              }
            });
            // --------------------------------------------------------------------------------------------------

            // --------------------------------------------------------------------------------------------------
          },
          fail: (err) => {
            console.log('微信支付接口调用失败1:', err);
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
  cashPayment() {
    const itsid = wx.getStorageSync('itsid');
    const app = getApp();
    
    // 修改：与initiatePayment保持一致的unitId获取逻辑
    let unitId;
    if (this.data.selected === '自提') {
      unitId = wx.getStorageSync('selectedStoreId');
    } else {
      // 外送时，优先使用存储中的deliveryUnitId，如果没有则使用app.globalData中的，如果也没有则使用默认值
      unitId = wx.getStorageSync('deliveryUnitId') || app.globalData.deliveryUnitId || '6'; // 默认外送门店ID为6
    }
    
    // 计算正确的总金额
    let totalAmount = parseFloat(this.data.totalprice);
    
    if (this.data.selected === '自提' && !unitId) {
      wx.showToast({
        title: '请选择门店',
        duration: 2000
      })
      console.log('未选择门店，中止支付流程');
      return
    }
    
    // 如果是外送订单，加上配送费
    if (this.data.selected === '外送') {
      totalAmount = Number(totalAmount) + Number(this.data.delivery);
      console.log('外送订单，添加配送费后总金额(元):', totalAmount);
    }
    
    // 将金额转为分单位，乘以100
    const amtInCents = Math.round(totalAmount * 100);
    console.log('转换前totalAmount(元):', totalAmount);
    console.log('转换后amtInCents(分):', amtInCents);
    
    console.log('支付模式:', this.data.selected);
    console.log('使用的门店ID:', unitId);
    console.log('计算后的总金额（含配送费）:', totalAmount);
    
    let that = this
    console.log('向后端发送的支付金额(元):', totalAmount);
    
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=122&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      method: 'POST',
      data: {
        MCODE: '',
        OPID: '1200',
        // UNITID: this.data.selected === '自提' ? unitId : '',
        UNITID: unitId,
        NUM: '',
        USERID: '0',
        NOTE: ' ',
        // 现金支付金额为订单总价
        AMT: totalAmount,
        // IMGS: JSON.stringify(this.data.items.map(item => item.img))
        XXSQ: 'SQB',
        RURL: '/subPackages/package/pages/jiesuan-payResult/jiesuan-payResult',
        type: this.data.selected === '自提' ? 1 : 2,
        username: this.data.username,
        phone: this.data.phone,
        address: this.data.address,
        extra: JSON.stringify({in_lite_app: true})
      },
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        wx.hideToast()
        if (!that.data.usePoints && !that.data.useCoupon) {
          console.log("返回订单数据:", res);

          let packageNew = encodeURIComponent(res.data.yeepay.package)
          let paySignNew = encodeURIComponent(res.data.yeepay.paySign)

          console.log("packageNew:", packageNew);
          console.log("paySignNew:", paySignNew);

                    // 核对金额信息：前端计算 vs 后端返回
          console.log('后端返回的AMT(分):', res.data.AMT);
          console.log('我们计算的金额(分):', amtInCents);
          
          // 确保使用我们计算的金额而不是后端返回的金额
          console.log('强制使用前端计算的金额(包含配送费)');
          
          // 构建URL参数 - 关键点是确保使用amtInCents
          const orderType = this.data.selected === '外送' ? '2' : '1';
          const urlParams = {
            return_url: res.data.rurl,
            orderid: res.data.orderid,
            terminal: res.data.terminal_sn,
            amt: amtInCents.toString(), // 确保是字符串类型
            sign: res.data.sign,
            appId: res.data.yeepay.appId,
            nonceStr: res.data.yeepay.nonceStr,
            package: packageNew,
            paySign: paySignNew,
            signType: res.data.yeepay.signType,
            timeStamp: res.data.yeepay.timeStamp,
            SN: res.data.SN,
            orderType: orderType // 改用orderType，避免与type冲突
          };
          
          // 构建完整URL
          let url = '/subPackages/package/pages/jiesuan-pay/jiesuan-pay?';
          for (const key in urlParams) {
            if (urlParams[key]) {
              url += `${key}=${urlParams[key]}&`;
            }
          }
          url = url.slice(0, -1); // 移除最后的&
          
          console.log('最终导航URL:', url);
          
          // 打印调试信息，检查金额是否一致
          console.log('支付页面使用的总金额(分):', amtInCents);
          console.log('预期金额包括:', this.data.selected === '外送' ? '商品价格+5元配送费' : '商品价格');
          
          wx.navigateTo({
            url: url,
          })
        }
        // wx.requestPayment({
        //   timeStamp: res.data.timeStamp,
        //   nonceStr: res.data.nonceStr,
        //   package: res.data.package,
        //   signType: res.data.signType,
        //   paySign: res.data.paySign,
        //   success: async (payRes) => {
        //     // 支付成功后按顺序调用两个接口
        //     try {
        //       // 1. 获取 orderid
        //       const userid = wx.getStorageSync('userid');
        //       const orderid = await new Promise((resolve, reject) => {
        //         wx.request({
        //           url: `${app.globalData. AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10622&userid=${userid}`,
        //           success: (res) => {
        //             if (res.data.code === '1' && res.data.result?.list?.[0]?.orderid) {
        //               resolve(res.data.result.list[0].orderid);
        //             } else {
        //               reject('接口返回数据异常');
        //             }
        //           },
        //           fail: reject
        //         });
        //       });

        //       // 2. 更新订单状态
        //       await new Promise((resolve, reject) => {
        //         wx.request({
        //           url: `${app.globalData.AUrl}/jy/go/phone.aspx?mbid=10617&ituid=106&itsid=${itsid}`,
        //           method: 'POST',
        //           data: {
        //             orderid: String(orderid),
        //             type: this.data.selected === '自提' ? 1 : 2,
        //             username: this.data.username,
        //             phone: this.data.phone,
        //             address: this.data.address
        //           },
        //           success: resolve,
        //           fail: reject
        //         });
        //       });

        //       console.log('订单处理完成');

        //       // 跳转到订单页面
        //       wx.switchTab({
        //         url: '/pages/orders/orders'
        //       });
        //     } catch (err) {
        //       console.error('订单处理失败:', err);
        //       wx.showToast({
        //         title: '订单状态更新失败',
        //         icon: 'none'
        //       });
        //     }
        //   },
        //   fail: (err) => {
        //     console.error('支付失败2:', err);
        //     // wx.showToast({
        //     //   title: '支付失败，请重试',
        //     //   icon: 'none'
        //     // });
        //   }
        // });
      }
    });
  },


  // 新增独立卡券支付方法
  couponPayment() {
    const itsid = wx.getStorageSync('itsid');
    const userid = wx.getStorageSync('userid');
    const total = parseFloat(this.data.totalprice) +
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
    
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=125&ituid=${app.globalData.ituid}&itsid=${itsid}`, // 使用125
      method: 'POST',
      data: {
        MCODE: '',
        OPID: '1204', // 新操作码区分卡券支付
        UNITID: unitId,
        NOTE: ' ',
        NUM: '',
        USERID: userid,
        cardid: this.data.cardid, // 从data获取预存的卡券ID
        AMT: 0,
        extra: JSON.stringify({in_lite_app: true})
      },
      success: (res) => {
        this.handlePaymentResult(res, 'coupon');
        wx.setStorageSync('updataArray', [])
      }
    });
  },
  balancePayment() {
    this.storedPay('1201', '余额支付成功');
  },
  coffeeWalletPayment() {
    this.storedPay('1203', '咖啡券支付成功');
  },
  depositPayment() {
    this.storedPay('1202', '储值卡支付成功');
  },
  storedPay(opid, successText) {
    const itsid = wx.getStorageSync('itsid');
    const userid = wx.getStorageSync('userid');
    const unitId = this.data.selected === '自提'
      ? (wx.getStorageSync('selectedStoreId') || app.globalData.selectedStoreId)
      : (wx.getStorageSync('deliveryUnitId') || app.globalData.deliveryUnitId || '6');
    const totalAmount = Number(this.data.payableAmount || this.data.totalprice || 0);
    const payScore = opid === '1203' ? totalAmount : '';
    const payload = {
      MCODE: '',
      OPID: opid,
      UNITID: unitId,
      NOTE: this.data.selected === '外送' ? `${successText}-外送` : `${successText}-自提`,
      NUM: '',
      USERID: userid,
      AMT: opid === '1203' ? 0 : totalAmount,
      SCORE: payScore,
      type: this.data.selected === '自提' ? 1 : 2,
      username: this.data.username,
      phone: this.data.phone,
      address: this.data.address
    };
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=124&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      method: 'POST',
      data: payload,
      header: { 'content-type': 'application/json' },
      success: (res) => {
        console.log('支付对账日志', {
          OPID: payload.OPID,
          AMT: payload.AMT,
          SCORE: payload.SCORE,
          resp: res && res.data
        });
        const type = opid === '1201' ? 'balance' : (opid === '1202' ? 'deposit' : 'coffee');
        this.handlePaymentResult(res, type);
      },
      fail: () => wx.showToast({ title: '支付失败，请重试', icon: 'none' })
    });
  },
  // 新增：获取卡券列表接口
  fetchCoupons() {
    const that = this;
    const userid = wx.getStorageSync('userid');
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=0902&itcid=10619&userid=${userid}`,
      method: 'GET',
      success: (res) => {
        const list = (res.data && res.data.result) ? res.data.result : [];
        const List1 = [];
        const List2 = [];
        list.forEach(item => {
          item.endTime = (item.endTime || '').replace(/^[^\/]+\//, '');
          if (item.status == '1') List1.push(item);
          else if (item.status == '2') List2.push(item);
        });
        that.setData({ List1, List2, couponList: list });
        if (List1.length > 0) {
          const first = List1[0];
          that.setData({
            cardid: first.cardid,
            selectedCouponText: `[${first.cardName}] 已减￥${first.atm}`,
            couponAvailable: true,
            useCoupon: true,
            appliedCouponAmt: Number(first.atm || 0)
          });
          that.recomputePayable();
        } else {
          that.setData({ couponAvailable: false, useCoupon: false });
          wx.showToast({ title: '当前订单无可用卡券', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('获取卡券请求失败', err);
      }
    });
  },
  // 重构后的统一结果处理方法
  handlePaymentResult(res, type) {
    console.log('钱包支付返回：', type, res && res.data);
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
      },
      balance: {
        success: '余额支付成功',
        fail: '余额支付失败'
      },
      deposit: {
        success: '储值卡支付成功',
        fail: '储值卡支付失败'
      },
      coffee: {
        success: '咖啡券支付成功',
        fail: '咖啡券支付失败'
      }
    }[type];

    const resp = res && res.data ? res.data : {};
    const hasOrder = !!(resp.orderid || resp.ORDERID || resp.sn || resp.SN || resp.result?.orderid || resp.result?.list?.[0]?.orderid);
    const success = resp.code === '1' || resp.code === 1 || resp.code === '0' || resp.code === 0 || resp.success === true ||
      resp.result === '1' || resp.result === 1 || /成功/.test(String(resp.msg || resp.desc || '')) || hasOrder;
    if (success) {
      // 公共成功处理（不修改原有逻辑）
      const categories = wx.getStorageSync('categories') || [];
      categories.forEach(cat => cat.children?.forEach(i => i.num = 0));
      wx.setStorageSync('categories', categories);
      wx.removeStorageSync('updataArray');
      wx.removeStorageSync('cartItems');
      wx.setStorageSync('sum', 0);
      wx.setStorageSync('total', 0);

      wx.showToast({
        title: msg.success,
        icon: 'success'
      });
      setTimeout(() => wx.navigateTo({
        url: '/subPackages/package/pages/jiesuan-payResult/jiesuan-payResult'
      }), 1200);
    } else {
      wx.showToast({
        title: resp.msg || resp.desc || msg.fail,
        icon: 'none'
      });
    }
  },



  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const selected = app.globalData.selected;
    // 更新全局相关信息onsho
    this.setData({
      isShow: true,
      selected: app.globalData.selected,
      address: app.globalData.selected === '外送' ? (app.globalData.addressDesc || '') : (app.globalData.storeName || ''),
      phone: app.globalData.phone,
      username: app.globalData.username,
      storeName: app.globalData.selectedStoreName,
      unitId: app.globalData.selectedStoreId,
      delivery: app.globalData.delivery || 5
    }, () => {
      // 直接调用 fetchItems，回调中会计算总价
      this.fetchItems();
      // 获取用户积分
      this.getUserScore();
      // 应用选中的优惠券
      const picked = wx.getStorageSync('selectedCoupon');
      if (picked && picked.cardid) {
        this.setData({
          cardid: picked.cardid,
          selectedCouponText: `[${picked.cardName}] 已减￥${picked.atm}`,
          couponAvailable: true,
          useCoupon: true,
          appliedCouponAmt: Number(picked.atm || 0)
        });
        this.recomputePayable();
        wx.removeStorageSync('selectedCoupon');
      }
      // 自动选择可用优惠券（若尚未选择）
      if (!this.data.selectedCouponText) {
        this.fetchCoupons();
      }
      // 预取资金余额
      this.prefetchFunds && this.prefetchFunds();
    });
  },
  // 获取用户积分方法
  getUserScore() {
    const that = this;
    const itsid = wx.getStorageSync('itsid');
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      success(res) {
        if (res.data.code === '1') {
          const score = parseInt(res.data.score || 0, 10);
          that.setData({
            userScore: score,
            requiredScore: Math.ceil(that.data.totalprice * 1.6) // 计算所需积分
          });
        }
      }
    });
  },
      // 计算总价（商品单价*数量，如外送再加配送费）
  calculateTotal: function () {
    let total = this.data.items.reduce((sum, item) => {
      const quantity = Number(item.num) || 0;
      const price = Number(item.price) || 0;
      return sum + (quantity * price);
    }, 0);

    // 更新显示用的基本价格（不含配送费）
    this.setData({
      totalprice: total.toFixed(2)
    });

    // 对于外送订单，我们需要实时显示含配送费的总价
    // 但配送费会在支付时单独加上，这样避免重复计算
    // 注意：这里不修改totalprice，只用于显示
    if (this.data.selected === '外送') {
      let totalWithDelivery = total + Number(this.data.delivery);
      console.log('含配送费的总价:', totalWithDelivery.toFixed(2));
    }
    this.recomputePayable();
  },
  recomputePayable() {
    const base = Number(this.data.totalprice || 0);
    const includeDelivery = this.data.selected === '外送' ? Number(this.data.delivery||0) : 0;
    const couponAmt = Number(this.data.appliedCouponAmt || 0);
    const payable = Math.max(0, base + includeDelivery - couponAmt);
    this.setData({ payableAmount: payable.toFixed(2) });
  },
  // 设置取餐方式（自提内）
  setDineType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ dineType: type, selected: '自提' });
  },
  // 备注输入处理
  inputRemark(e) {
    this.setData({ remark: e.detail.value });
  },


  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
  ,
  // 预取资金余额（余额/咖啡券/储值卡）
  prefetchFunds() {
    const itsid = wx.getStorageSync('itsid');
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        const balance = Number(res.data.money || 0);
        const coffee = Number(res.data.score || 0);
        const deposit = Number(res.data.chuzhika || res.data.chuhzika || 0);
        const total = Number(this.data.selected === '外送' ? (this.data.totalprice*1 + this.data.delivery*1) : this.data.totalprice) || 0;
        this.setData({
          funds: { balance, coffee, deposit },
          balanceDisabled: !(balance >= Number(this.data.payableAmount || total)),
          coffeeDisabled: !(coffee >= Number(this.data.payableAmount || total)),
          depositDisabled: !(deposit >= Number(this.data.payableAmount || total)),
          payMethod: this.data.payMethod || 'wechat'
        });
      }
    });
  },
  // 选择支付方式
  choosePayMethod(e) {
    const val = e.detail.value;
    this.setData({ payMethod: val, pendingPayMethod: '' });
  },
  guardBalancePay() {
    const payable = Number(this.data.payableAmount || this.data.totalprice || 0);
    if (this.data.balanceDisabled || Number(this.data.funds.balance || 0) < payable) {
      wx.showToast({ title: '余额不足抵扣', icon: 'none' });
      return;
    }
    this.setData({ payMethod: 'balance', pendingPayMethod: '' });
  },
  guardCoffeePay() {
    const payable = Number(this.data.payableAmount || this.data.totalprice || 0);
    if (this.data.coffeeDisabled || Number(this.data.funds.coffee || 0) < payable) {
      wx.showToast({ title: '咖啡券不足抵扣', icon: 'none' });
      return;
    }
    this.setData({ payMethod: 'coffee', pendingPayMethod: '' });
  },
  guardDepositPay() {
    const payable = Number(this.data.payableAmount || this.data.totalprice || 0);
    if (this.data.depositDisabled || Number(this.data.funds.deposit || 0) < payable) {
      wx.showToast({ title: '储值卡不足抵扣', icon: 'none' });
      return;
    }
    this.setData({ payMethod: 'deposit', pendingPayMethod: '' });
  },
  // 优惠券行点击
  couponSelect() {
    wx.navigateTo({
      url: '/subPackages/package/pages/coupon-select/coupon-select?from=jiesuan'
    });
  }
})
