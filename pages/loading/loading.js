const app = getApp();
Page({
  data: {
    tupianUrl: app.globalData.tupianUrl,
    seconds: 3, // 初始倒计时秒数
    showPrivacy: false, // 默认显示隐私弹窗
    privacyAgreed: false, // 用户是否同意隐私协议
    forceUpdateFlag: 0 // 用于强制更新视图的标志
  },

  onLoad: function () {
    console.log('加载页面...');

    // 清除先前可能存在的定时器
    if (this.interval) {
      clearInterval(this.interval);
    }

    // 初始状态设置为显示隐私弹窗
    this.setData({
      showPrivacy: false
    });

    // 使用setTimeout确保UI先渲染出隐私弹窗，再检查是否需要显示
    setTimeout(() => {
      this.checkPrivacyAgreement();
    }, 500);
  },

  // 清除隐私协议同意状态（用于测试，正式使用时可删除）
  clearPrivacyAgreement: function () {
    try {
      console.log('清除隐私协议同意状态');
      wx.removeStorageSync('hasAgreedPrivacy');
      wx.removeStorageSync('privacyAgreedTime');
    } catch (error) {
      console.error('清除隐私协议状态失败:', error);
    }
  },

  // 单独抽取检查隐私协议同意状态的逻辑
  checkPrivacyAgreement: function () {
    try {
      const app = getApp();

      // 首先检查app全局变量
      let hasAgreedFromApp = app.globalData.hasAgreedPrivacy;
      console.log('App全局变量中的隐私协议状态:', hasAgreedFromApp);

      // 然后检查本地存储
      const hasAgreedPrivacy = wx.getStorageSync('hasAgreedPrivacy');
      const privacyAgreedTime = wx.getStorageSync('privacyAgreedTime');

      console.log('是否已同意隐私协议:', hasAgreedPrivacy);
      console.log('同意隐私协议的时间:', privacyAgreedTime);

      // 如果全局变量或本地存储中有一个表示同意，则认为用户已同意
      const hasAgreed = hasAgreedFromApp || ((hasAgreedPrivacy === true || hasAgreedPrivacy === 'true') && privacyAgreedTime);

      if (hasAgreed) {
        // 已同意隐私协议，直接启动倒计时
        console.log('用户已同意隐私协议，直接进入');
        this.setData({
          showPrivacy: false,
          seconds: 3
        });
        this.startCountDown();
      } else {
        console.log('用户未同意隐私协议，显示弹窗');
        // 确保显示隐私弹窗
        this.setData({
          showPrivacy: true
        });

        // 为确保在真机上显示，尝试强制更新视图
        this.forceUpdate();
      }
    } catch (error) {
      console.error('检查隐私协议状态出错:', error);
      // 出错时默认显示隐私弹窗
      this.setData({
        showPrivacy: true
      });

      // 为确保在真机上显示，尝试强制更新视图
      this.forceUpdate();
    }
  },

  // 强制更新视图的方法
  forceUpdate: function () {
    // 尝试通过修改其他数据项来触发视图更新
    this.setData({
      forceUpdateFlag: Math.random()
    });
  },

  // 同意隐私协议
  agreePrivacy: function () {
    console.log('用户点击同意');
    try {
      // 设置已同意隐私协议标志
      wx.setStorageSync('hasAgreedPrivacy', true);
      // 保存同意时间
      wx.setStorageSync('privacyAgreedTime', new Date().getTime());

      this.setData({
        showPrivacy: false,
        privacyAgreed: true,
        seconds: 3
      });

      // 同意后开始倒计时
      this.startCountDown();
    } catch (error) {
      console.error('保存隐私协议同意状态失败:', error);
      // 即使保存失败也继续
      this.setData({
        showPrivacy: false
      });
      this.startCountDown();
    }
  },

  // 拒绝隐私协议 - 直接退出小程序
  rejectPrivacy: function () {
    console.log('用户点击不同意');
    try {
      // 确保未设置同意标志
      wx.removeStorageSync('hasAgreedPrivacy');

      // 调用微信的退出小程序API
      wx.exitMiniProgram({
        success: () => {
          console.log('成功退出小程序');
        },
        fail: (err) => {
          console.error('退出小程序失败:', err);
          // 开发者工具可能不支持退出，显示提示
          wx.showModal({
            title: '提示',
            content: '您已拒绝隐私协议，将退出小程序',
            showCancel: false,
            success: () => {
              console.log('用户确认退出提示');
            }
          });
        }
      });
    } catch (error) {
      console.error('退出小程序出错:', error);
      // 显示提示
      wx.showModal({
        title: '提示',
        content: '您已拒绝隐私协议，请退出小程序',
        showCancel: false
      });
    }
  },

  // 查看隐私协议详情
  viewPrivacyDetail: function () {
    wx.navigateTo({
      url: '/subPackages/package/pages/xieyi/xieyi?agreement=privacy'
    });
  },

  // 查看用户协议详情
  viewUserAgreement: function () {
    wx.navigateTo({
      url: '/subPackages/package/pages/xieyi/xieyi?agreement=user'
    });
  },

  // 开始倒计时
  startCountDown: function () {
    console.log('开始倒计时');
    // 清除之前的定时器
    if (this.interval) {
      clearInterval(this.interval);
    }

    // 将interval存储到this中，以便其他方法访问
    this.interval = setInterval(() => {
      this.setData({
        seconds: this.data.seconds - 1
      });
      console.log(`倒计时: ${this.data.seconds}秒`);

      if (this.data.seconds <= 0) {
        clearInterval(this.interval);
        this.executeJump(); // 提取跳转逻辑到单独方法
      }
    }, 1000);
  },

  // 提取跳转逻辑到单独方法
  executeJump: function () {
    console.log('跳转执行...');

    if (wx.getStorageSync('itsid')) {
      wx.setStorageSync('isLoginSuccess', true);
      wx.switchTab({
        url: '/pages/home/home',
      });
    } else {
      wx.setStorageSync('isLoginSuccess', false);
      wx.switchTab({
        url: '/pages/home/home',
      });
    }
  },

  passCountDown() {
    clearInterval(this.interval);
    this.executeJump();
  },

  onShow: function () {
    // 页面显示时再次检查隐私协议状态
    // 这对于从协议详情页返回很有用
    const hasAgreedPrivacy = wx.getStorageSync('hasAgreedPrivacy');
    if (!hasAgreedPrivacy) {
      this.setData({
        showPrivacy: true
      });
    }
  },

  onHide: function () {
    // 页面隐藏时清除定时器
    if (this.interval) {
      clearInterval(this.interval);
    }
  },

  onUnload: function () {
    // 页面卸载时清除定时器
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
});