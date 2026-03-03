const app = getApp();
Page({
  data: {
    // 核心数据（和图片匹配）
    name: '',
    avatar: '', // 头像地址
    money: 0.00, // 个人余额
    coffeeCoupon: 0.00, // 咖啡券
    depositCard: 0.00, // 储值卡
    electronicCoupon: 0.00, // 电子券
    AUrl: app.globalData.AUrl,
    isLogin: false
  },
  logoutConfirm() {
    wx.showModal({
      title: '提示',
      content: '确认退出登录？',
      confirmText: '退出登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.clearStorageSync();
          } catch (e) {}
          getApp().globalData.userid = null;
          getApp().globalData.itsid = null;
          this.setData({
            isLogin: false,
            name: '',
            avatar: '',
            money: 0.00,
            coffeeCoupon: 0.00,
            depositCard: 0.00,
            electronicCoupon: 0.00
          });
          wx.switchTab({ url: '/pages/home/home' });
        }
      }
    });
  },

  // 右上角二维码点击事件
  gotoQrcode() {
    wx.showToast({
      title: '二维码功能暂未实现',
      icon: 'none'
    })
    // 后续补充二维码逻辑：
    // wx.navigateTo({
    //   url: '/subPackages/package/pages/qrcode/qrcode',
    // })
  },

  // 卡狄D套餐详情
  gotocardDetail() {
    const raw = wx.getStorageSync('isLoginSuccess');
    const isLogin = raw === true || raw === 'true' || raw === 1 || raw === '1' || !!wx.getStorageSync('itsid') || !!wx.getStorageSync('userid');
    if (!isLogin) {
      wx.showModal({
        title: '提示',
        content: '目前暂未登录，是否跳转登录页面？',
        confirmText: '立即登录',
        cancelText: '取消',
        success(res){
          if (res.confirm){
            wx.navigateTo({ url: '/subPackages/user/pages/register/register?from=cardDetail' });
          }
        }
      });
      return;
    }
    // 跳转到套餐列表页面
    wx.navigateTo({
      url: '/subPackages/package/pages/cardList/cardList',
    })
  },

  // 电商订单
  gotoEcommerceOrder() {
    wx.showToast({
      title: '暂未实现',
      icon: 'none'
    })
  },

  // 口味定制
  gotoTasteCustom() {
    wx.showToast({
      title: '暂未实现',
      icon: 'none'
    })
  },

  // 公告
  gotoNotice() {
    wx.showToast({
      title: '暂未实现',
      icon: 'none'
    })
  },

  // 领券中心
  gotoCouponCenter() {
    wx.showToast({
      title: '暂未实现',
      icon: 'none'
    })
  },

  // 我的优惠券
  gotoMyCoupon() {
    wx.navigateTo({
      url: '/subPackages/package/pages/kaquan/kaquan',
    })
  },

  // 收货地址
  gotoAddress() {
    wx.showToast({
      title: '暂未实现',
      icon: 'none'
    })
  },

  // 我的收藏
  gotoCollection() {
    wx.showToast({
      title: '暂未实现',
      icon: 'none'
    })
  },

  // 会员订单
  gotoMemberOrder() {
    wx.showToast({
      title: '暂未实现',
      icon: 'none'
    })
  },

  // 微股东门店
  gotoShareholderStore() {
    wx.showToast({
      title: '暂未实现',
      icon: 'none'
    })
  },

  // 子账户
  gotoSubAccount() {
    const raw = wx.getStorageSync('isLoginSuccess');
    const isLogin = raw === true || raw === 'true' || raw === 1 || raw === '1' || !!wx.getStorageSync('itsid') || !!wx.getStorageSync('userid');
    if (!isLogin) {
      wx.showModal({
        title: '提示',
        content: '目前暂未登录，是否跳转登录页面？',
        confirmText: '立即登录',
        cancelText: '取消',
        success(res){
          if (res.confirm){
            wx.navigateTo({ url: '/subPackages/user/pages/register/register?from=my' });
          }
        }
      });
      return;
    }
    wx.navigateTo({
      url: '/subPackages/package/pages/qiehuan/qiehuan',
    })
  },

  // 我的好友
  gotoMyFriend() {
    wx.showToast({
      title: '暂未实现',
      icon: 'none'
    })
  },

  // 发票管理
  gotoInvoice() {
    const raw = wx.getStorageSync('isLoginSuccess');
    const isLogin = raw === true || raw === 'true' || raw === 1 || raw === '1' || !!wx.getStorageSync('itsid') || !!wx.getStorageSync('userid');
    if (!isLogin) {
      wx.showModal({
        title: '提示',
        content: '目前暂未登录，是否跳转登录页面？',
        confirmText: '立即登录',
        cancelText: '取消',
        success(res){
          if (res.confirm){
            wx.navigateTo({ url: '/subPackages/user/pages/register/register?from=my' });
          }
        }
      });
      return;
    }
    wx.navigateTo({
      url: '/subPackages/package/pages/fapiao/fapiao',
    })
  },

  // 邀请码
  gotoInviteCode() {
    const raw = wx.getStorageSync('isLoginSuccess');
    const isLogin = raw === true || raw === 'true' || raw === 1 || raw === '1' || !!wx.getStorageSync('itsid') || !!wx.getStorageSync('userid');
    if (!isLogin) {
      wx.showModal({
        title: '提示',
        content: '目前暂未登录，是否跳转登录页面？',
        confirmText: '立即登录',
        cancelText: '取消',
        success(res){
          if (res.confirm){
            wx.navigateTo({ url: '/subPackages/user/pages/register/register?from=my' });
          }
        }
      });
      return;
    }
    wx.navigateTo({
      url: '/subPackages/package/pages/putong/putong',
    })
  },

  // 设置
  gotoSetting() {
    wx.showToast({
      title: '暂未实现',
      icon: 'none'
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 如需从接口获取数据，保留以下逻辑（无需则删除）
    const itsid = wx.getStorageSync('itsid');
    if (itsid) {
      this.fetchUserData(itsid);
    }
  },
  tapLeftWrap() {
    const raw = wx.getStorageSync('isLoginSuccess');
    const isLogin = raw === true || raw === 'true' || raw === 1 || raw === '1' || !!wx.getStorageSync('itsid') || !!wx.getStorageSync('userid');
    if (!isLogin) {
      wx.navigateTo({ url: '/subPackages/user/pages/register/register?from=my' });
    }
  },
  cardLoginPrompt() {
    const raw = wx.getStorageSync('isLoginSuccess');
    const isLogin = raw === true || raw === 'true' || raw === 1 || raw === '1' || !!wx.getStorageSync('itsid') || !!wx.getStorageSync('userid');
    if (!isLogin) {
      wx.showModal({
        title: '提示',
        content: '目前暂未登录，是否跳转登录页面？',
        confirmText: '立即登录',
        cancelText: '取消',
        success(res){
          if (res.confirm){
            wx.navigateTo({ url: '/subPackages/user/pages/register/register?from=my' });
          }
        }
      });
      return;
    }
    this.gotocardDetail();
  },

  // 从接口获取用户数据（如需则保留，无需则删除）
  fetchUserData(itsid) {
    const that = this;
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          that.setData({
            name: res.data.name || '',
            money: res.data.money || 0.00,
            coffeeCoupon: res.data.score || 0.00,
            depositCard: res.data.chuhzika || 0.00,
            electronicCoupon: res.data.dianzi || 0.00,
            avatar: `${app.globalData.AUrl}/jy/wxuser/106/images/singeravatar/` + (res.data.avatar || '')
          });
        }
      }
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    const itsid = wx.getStorageSync('itsid');
    //这里页面会闪动到时解决，先判断是否登录，再获取用户数据
    if (itsid) {
      this.fetchUserData(itsid);
    }
    const raw = wx.getStorageSync('isLoginSuccess');
    const isLogin = raw === true || raw === 'true' || raw === 1 || raw === '1' || !!itsid || !!wx.getStorageSync('userid');
    this.setData({ isLogin });
    
  }
})
