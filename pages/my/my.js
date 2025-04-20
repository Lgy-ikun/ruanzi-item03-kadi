const app = getApp();
Page({
  data: {
    name: '', // 用户名
    leixing: '', //用户类型
    content: '', // 我的消费券
    score: '', // 可用积分
    freeze: '', // 冻结积分
    money: '', // 余额
    cupsDrank: 0, // 已喝咖啡的杯数
    totalCups: 100, // 总杯数，可以根据实际情况调整
    progress: 0, // 进度条的进度，从0到100
    tupianUrl: app.globalData.tupianUrl,
    AUrl: app.globalData.AUrl,
    avatar: '${AUrl}/jy/wxuser/106/images/info/beiload.png/mylogo1.jpg',
    dai: '',
    yi: ''
  },
  onclik: function () {
    wx.navigateTo({
      url: '/subPackages/package/pages/keyongjifen/keyongjifen',
    })
  },
  onxiaofeiquan: function () {
    wx.navigateTo({
      url: '/subPackages/package/pages/xiaofeiquan/xiaofeiquan',
    })
  },
  charge() {
    wx.navigateTo({
      url: '/subPackages/package/pages/yishifang/yishifang',
    })
  },
  charge1() {
    wx.navigateTo({
      url: '/subPackages/package/pages/daishifang/daishifang',
    })
  },
  // 页面加载完成后，初始化进度条
  onReady: function () {
    this.updateProgress();
  },
  updateProgress: function () {
    let progress = (this.data.cupsDrank / this.data.totalCups) * 100;
    this.setData({
      progress: progress
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },
  avatar() {
    wx.navigateTo({
      url: '/subPackages/user/pages/register/register',
    })
  },
  calendar() {
    wx.navigateTo({
      url: '/subPackages/package/pages/calendarCard/calendarCard',
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },
  onLoad: function () {
    const itsid = wx.getStorageSync('itsid');

    if (itsid) {
      this.fetchData(itsid);
    } else {
      console.error('itsid 未定义或获取失败');
      // 处理 itsid 未定义的情况，例如提示用户或跳转到登录页面
      wx.showToast({
        title: '未登录或会话已过期',
        icon: 'none'
      });
      wx.navigateTo({
        url: '/subPackages/user/pages/login/login',
      });
    }
  },
  fetchData: function (itsid) {
    const that = this;
    const AUrl = app.globalData.AUrl;
    const userid = wx.getStorageSync('userid');
    wx.request({
      url: `${app.globalData. AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`, // 注意：这里需要确保 URL 是合法的
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          app.globalData.userid = res.data.userid;
          app.globalData.score = res.data.score; // 将 score 存储到全局变量中
          app.globalData.contente = res.data.content;
          that.setData({
            name: res.data.name || '未登录',
            leixing: res.data.leixing || '用户',
            // leixing: '股东',
            content: res.data.content || '0',
            freeze: res.data.freeze || '0',
            money: res.data.money || '0',
            score: res.data.score || '0',
            avatar:  `${app.globalData. AUrl}/jy/wxuser/106/images/singeravatar/`+ res.data.avatar,
            userid: res.data.userid
          });
          app.globalData.userid = res.data.userid;
          wx.setStorageSync('userid', res.data.userid)
        }
      },
      fail: (error) => {
        console.error('获取数据失败', error);
        wx.showToast({
          title: '获取数据失败，请检查网络或联系管理员',
          icon: 'none'
        });
      }
    });
    wx.request({
      url: `${app.globalData. AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10634&userid=${userid}`,
      method: 'GET',
      success: function (res) {
        console.log('接口返回数据:', res.data); // 调试信息
        if (res.statusCode === 200) {
          if (res.data && res.data.code === "1" && res.data.result && res.data.result.list && res.data.result.list.length > 0) {
            // 处理数据，确保没有小数点
            const dai = Math.floor(parseFloat(res.data.result.list[0].dai || '0'));
            const yi = Math.floor(parseFloat(res.data.result.list[0].yi || '0'));

            that.setData({
              dai: dai.toString(), // 转换为字符串
              yi: yi.toString() // 转换为字符串
            });
          } else {
            console.error('数据格式错误或为空', res.data);
            that.setData({
              dai: '0',
              yi: '0'
            });
            wx.showToast({
              title: '数据错误',
              icon: 'none'
            });
          }
        } else {
          console.error('请求失败，状态码:', res.statusCode);
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          });
        }
      },
      fail: function (error) {
        console.error('请求失败', error);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    const itsid = wx.getStorageSync('itsid');
    if (itsid) {
      this.fetchData(itsid); // 调用 fetchData 获取数据
    }
    // const tabBar = this.getTabBar();
    // if (typeof this.getTabBar().setData === 'function' && this.getTabBar()) {
    //   tabBar.setData({
    //     active: 3 //这里的active的值根据你的routerList 顺序一致
    //   })
    // }
    // this.setData({
    //   avatar: wx.getStorageSync('avatar')
    // })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})