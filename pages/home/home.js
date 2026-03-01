const app = getApp();

// pages/home/home.js

// const imageCdn = 'https://tdesign.gtimg.com/mobile/demos';
// const swiperList = [
//   '/images/bgimg1.jpg',
//   '/images/bgimg2.jpg',
//   '/images/bgimg3.jpg',
// ];
// import SkylineBehavior from '@behaviors/skyline.js';

// Component({
//   behaviors: [SkylineBehavior],
// });
Page({

  /**
   * 页面的初始数据
   */
  data: {
    content: '', // 消费券数量
    freeze: '', //  冻结积分
    money: '', // 余额
    score: '', // 积分
    tupianUrl: app.globalData.tupianUrl,
    AUrl: app.globalData.AUrl,
    swiperList: [
      app.globalData.tupianUrl + '/new/bgimg1.png',
      app.globalData.tupianUrl + '/new/bgimg2.png',
      app.globalData.tupianUrl + '/new/bgimg3.png',
      app.globalData.tupianUrl + '/new/bgimg4.png',
    ],
    companyIconUrl: app.globalData.tupianUrl + '/new/company.png',
  },
  // onLoad: function() {
  //   const itsid= wx.getStorageSync('itsid')
  //   wx.request({
  //     url: `https://www.ruanzi.net/jy/go/we.aspx?ituid=106&itjid=10602&itcid=10602&itsid=${itsid}`,
  //     method: 'GET',
  //     success: function(res) {
  //       console.log(
  //         res
  //       );
  //     }
  //   })
  //   this.fetchData();
  // console.log(app.globalData); // 访问全局数据


  // },
  // fetchData: function () {
  //   const that = this;
  //   const itsid = wx.getStorageSync('itsid')
  //   // 后台接口地址
  //   wx.request({
  //     url: `https://www.ruanzi.net/jy/go/we.aspx?ituid=106&itjid=10602&itcid=10602&itsid=${itsid}`,
  //     method: 'GET',
  //     success: function (res) {
  //       console.log(res);
  //       if (res.statusCode == 200 & res.data) {
  //         that.setData({
  //           content: res.data.content,
  //           freeze: res.data.freeze,
  //           money: res.data.money,
  //           score: res.data.score,

  //         });
  //       }
  //     },
  //     fail: function (error) {
  //       console.error('获取数据失败', error);
  //     }
  //   });

  // },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const AUrl = app.globalData.AUrl;
    console.log('Options:', options);
    console.log('AUrl:', AUrl);
    console.log('query 参数:', options);
    const sys = wx.getSystemInfoSync();
    const windowWidth = sys.windowWidth || sys.screenWidth;
    const windowHeight = sys.windowHeight || sys.screenHeight;
    const swiperHeightRpx = Math.round(750 * (windowHeight / windowWidth) * 0.44);
    this.setData({ swiperHeight: swiperHeightRpx });
    const itsid = wx.getStorageSync('itsid');
    const userid = wx.getStorageSync('inviteUserid'); // 从 Storage 获取 invite
    console.log('对方userid', userid);



    // const invite = wx.getStorageSync('invite');
    // console.log('从缓存中获取的 invite:', invite); // 新增此行，打印缓存中的 invite
    this.fetchData10603(itsid);
    // const duifangCode = this.fetchDuiFangCode(userid)
    // console.log('对方Code', duifangCode);
    // const inviteCode = this.fetchCode()
    // console.log('自己的PN100：', inviteCode);
    // if(inviteCode !== '' || inviteCode !== null || inviteCode !== '0' || inviteCode !== 0) return
    // this.saveCode(duifangCode)
  },
  

  /**
   * 获取10603接口数据
   */
  fetchData10603: function (itsid, invite) {
    const that = this;
    const AUrl = app.globalData.AUrl;
    wx.request({
      url: `${AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          that.setData({
            content: res.data.content || '0',
            freeze: res.data.freeze || '0',
            money: res.data.money || '0',
            score: res.data.score || '0',
            name: res.data.name || '未登录',
            userid: res.data.userid || '0',
            avatarUrl: res.data.avatar || ''
          });
          // 存储全局变量
          // app.globalData.userid = res.data.userid;
          wx.setStorageSync('userid', res.data.userid);
          // console.log('用户ID已全局化:', app.globalData.userid);
        }
      },
      fail: (error) => {
        console.error('获取数据失败', error);
      }
    });
  },
  // this.fetchData(itsid);
  // const that = this;
  // wx.request({
  //   url: `https://www.ruanzi.net/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
  //   method: 'GET',
  //   success: (res) => {
  //     that.setData({
  //       content: res.data.content || '0',
  //       freeze: res.data.freeze || '0',
  //       money: res.data.money || '0',
  //       score: res.data.score || '0',
  //       name: res.data.name || '未登录',
  //       userid: res.data.userid || '0',
  //       // ... 设置其他数据
  //     });
  //     app.globalData.userid = res.data.userid;
  //     wx.setStorageSync('userid', res.data.userid)
  //     console.log('用户ID已全局化:', app.globalData.userid);
  //     console.log('Response data:', res.data);
  //     console.log('Page instance:', that);
  //     if (res.statusCode === 200 && res.data) {
  //       that.setData({
  //         avatarUrl: res.data.avatar,

  //       });


  // 若存在userid，证明是通过分享进入的
  //       if (options.userid) {
  //         wx.request({
  //           url: `https://www.ruanzi.net/jy/go/phone.aspx?mbid=10615&ituid=106&itsid=${itsid}`,
  //           method: 'POST',
  //           data: {
  //             invite: options.userid,
  //             userid: that.data.userid,
  //           },
  //         })
  //       }
  //     },
  //     fail: (error) => {
  //       console.error('获取数据失败', error);
  //     }
  //   });
  // },



  // fetchData: function (itsid) {
  //   const that = this;
  //   wx.request({
  //     url: `https://www.ruanzi.net/jy/go/we.aspx?ituid=106&itjid=10616&itcid=10616&itsid=`,
  //     method: 'GET',
  //     success: function (res) {
  //       // console.log(res.data.result.list[0].freeze);
  //       // if (res.statusCode === 200 && res.data) {
  //       that.setData({
  //         content: res.data.result.list[0].quan || '1342', // 积分
  //         freeze: res.data.result.list[0].freeze || '145', // 消费券数量
  //         money: res.data.result.list[0].money || '3000', // 余额
  //         score: res.data.result.list[0].score || '65' // 冻结积分
  //       });
  //       // }
  //     },
  //     fail: function (error) {
  //       console.error('获取数据失败', error);
  //     }
  //   });
  //   wx.request({
  //     url: `https://www.ruanzi.net/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
  //     method: 'GET',
  //     success: (res) => {
  //       console.log('Response data:', res.data);
  //       app.globalData.userid = res.data.userid
  //       console.log("user", app.globalData.userid);
  //       console.log('Page instance:', that);
  //       if (res.statusCode === 200 && res.data) {
  //         const app = getApp();
  //         app.globalData.name = res.data.name;
  //         console.log(app.globalData.name);
  //         that.setData({
  //           name: res.data.name || '未登录',
  //         });
  //       }
  //     },
  //     fail: (error) => {
  //       console.error('获取数据失败', error);
  //     }
  //   });
  // },

  // 首页到店取：预设自提并跳到点单页
  gotoOrderPickUp() {
    app.globalData.selected = '自提';
    wx.switchTab({
      url: '/pages/order/order',
    });
  },
  
  handleNavigate2() {
    if (!wx.getStorageSync('isLoginSuccess')) {
      wx.navigateTo({
        url: '/subPackages/user/pages/register/register?from=home',
      })
      return
    }
    wx.navigateTo({
      url: '/subPackages/package/pages/recharge/recharge',
    })
  },
  


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const itsid = wx.getStorageSync('itsid');
    if (itsid) {
      this.fetchData10603(itsid); // 调用10603接口获取数据
    }
    this.setData({
      avatar: wx.getStorageSync('avatar'),
      isLoginSuccess: wx.getStorageSync('isLoginSuccess')
    });
  },

  gotoLogin() {
    wx.navigateTo({
      url: `/subPackages/user/pages/register/register?from=home`,
    })
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

  onChange: function (e) {
    // 这里是处理 change 事件的逻辑
    // e.detail.current 会包含当前 swiper 的索引
    console.log('当前 swiper 的索引为：', e.detail.current);
  },

  onImageLoad: function (e) {
    // 这里是处理图片加载完成事件的逻辑
    console.log('图片加载完成', e);
  },

  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})
