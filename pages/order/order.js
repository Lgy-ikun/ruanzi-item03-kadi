const app = getApp();
Page({
  data: {
    sideBarIndex: 0,
    scrollTop: 0,
    sum: 0,
    totalprice: 0,
    categories: [], // 使用空数组初始化，稍后从服务器加载数据
    selected: '',
    address: '',
    storeName: '',
    authorized: false, // 是否已授权
    nearbyStores: [], // 附近门店数据
    latitude: '', // 用户纬度
    AUrl: app.globalData.AUrl,
    longitude: '', // 用户经度
    showRecommendationPopup: false, // 控制推荐弹窗的显示
    recommendedStore: null, // 推荐的最近门店
    showCartPopup: false, // 控制弹窗显示
    cartItems: [], // 弹窗内购物车数据，与 updataArray 同步
  },
  // 按 id 分组并累加数量
  groupItemsByQuantity: function (updataArray) {
    return updataArray.reduce((acc, item) => {
      // 若该 id 项不存在，则初始化（初始数量为 0）
      acc[item.id] = acc[item.id] || {
        ...item,
        num: 0
      };
      // 累加相同 id 的商品数量
      acc[item.id].num += item.num;
      return acc;
    }, {});
  },

  syncCategoriesFromUpdataArray: function (updataArray) {
    const groupedItems = this.groupItemsByQuantity(updataArray);
    const newCategories = this.data.categories.map(category => ({
      ...category,
      children: category.children.map(item => ({
        ...item,
        num: groupedItems[item.id]?.num || 0
      }))
    }));

    // 使用全量更新确保触发渲染
    this.setData({
      categories: newCategories
    });
  },

  onAddressSelected: function (e) {
    if (e.detail.addressDesc && e.detail.door) {
      // 更新页面数据，显示选中的地址
      this.setData({
        address: e.detail.addressDesc + e.detail.door,
        isDelivery: true // 假设您需要设置 isDelivery 为 true
      });
    }
  },
  chooseAddress: function () {
    wx.navigateTo({
      url: '/subPackages/package/pages/chooseLocation/chooseLocation?type=order'
    });
  },

  selectOption: function (e) {
    const option = e.currentTarget.dataset.option;
    app.globalData.selected = option
    console.log(option);
    // 更新全局数据和页面数据
    if (option === '外送') {
      // app.setSelected(option);
      // app.setAddress(''); // 如果选择外送，重置地址信息
      // app.setStoreInfo(''); // 如果选择外送，重置门店信息
      // this.setData({
      // selected: option,
      // isDelivery: true,
      // address: '',
      // storeInfo: ''
      // });
      wx.navigateTo({
        url: '/subPackages/package/pages/chooseLocation/chooseLocation?type=order'
      });
    } else {
      // app.setSelected(option);
      // app.setAddress(''); // 如果选择自提，重置地址信息
      // app.setStoreInfo('卡狄门店'); // 更新门店信息为默认值
      this.setData({
        selected: app.globalData.selected,
        // isDelivery: false,
        // address: '',
        storeName: app.globalData.storeName
      });
    }
    // 更新页面数据
    // this.setData({
    //   selected: option,
    //   address: option === '外送' ? app.globalData.addressDesc : '',
    //   storeInfo: option === '自提' ? app.globalData.storeInfo : ''
    // });
  },
  gobackPublish: function () {
    const app = getApp();
    const updataArray = wx.getStorageSync('updataArray') || [];
    const unitId = this.data.selected === '自提' ? wx.getStorageSync('selectedStoreId') : '';
    // const unitId = this.data.
    const backUrl = app.globalData.backUrl;

    // 筛选出购物车中数量大于 0 的商品
    const cartItems = updataArray.filter(item => item.num > 0);

    if (cartItems.length === 0) {
      wx.showToast({
        title: '购物车为空',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    if (this.data.storeName === '') {
      wx.showToast({
        title: '请选择门店',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.request({
      url: `${backUrl}phone.aspx?mbid=10639&ituid=106&keyvalue=${unitId}`,
      success(res) {
        console.log("是否营业：", res);
        if (res.data.code == '0') {
          wx.request({
            url: `${backUrl}phone.aspx?mbid=10627&ituid=${app.globalData.ituid}&itsid=${wx.getStorageSync('itsid')}`,
            method: "POST",
          })

          // 遍历购物车中的商品并发送到接口
          const requests = cartItems.map(item => {
            return new Promise((resolve, reject) => {
              wx.request({
                url: `${backUrl}phone.aspx?mbid=10604&ituid=${app.globalData.ituid}&itsid=${wx.getStorageSync('itsid')}`,
                method: "POST",
                data: {
                  MCODE: item.skuCode, // 商品的 SKU 代码
                  NUM: item.num, // 商品数量
                  UNITID: unitId, // 门店 ID（如果选择自提）
                  add: item.add || '', // 地址信息（如果选择外送）
                  img: item.image || '' // 商品图片
                },
                success(res) {
                  resolve(res);
                },
                fail(err) {
                  reject(err);
                }
              });
            });
          });
          // wx.setStorageSync('updataArray', [])
          wx.navigateTo({
            url: '/subPackages/package/pages/jiesuan/jiesuan',
          })
        }
        else {
          wx.showToast({
            title: res.data.desc,
            icon: 'error',
            mask: true
          })
        }
      }
    })


  },

  onLoad: function (options) {
    const AUrl = app.globalData.AUrl;
    this.fetchCategories();
    this.checkLocationPermission();
    if (options.address) {
      this.setData({
        address: decodeURIComponent(options.address),
        totalPrice: this.countTotalPrice()
      });
    }

    // 初始化购物车数据
    const updataArray = wx.getStorageSync('updataArray') || [];
    this.syncCategoriesFromUpdataArray(updataArray);
    this.setData({
      totalprice: this.countTotalPrice()
    });
  },
  onPullDownRefresh() {
    // 用户下拉刷新时，重新拉接口并合并缓存
    this.fetchCategories();
    wx.stopPullDownRefresh();
  },


  // 检查位置权限并获取位置
  checkLocationPermission: function () {
    console.log(123);
    const that = this;
    wx.getLocation({
      success(res) {
        console.log('获取位置成功:', res);
        that.getLocation(); // 或者直接用 res 中的经纬度
      },
      fail(err) {
        console.log('获取位置失败:', err);
        if (err.errMsg === 'getLocation:fail auth deny' || err.errMsg === 'getLocation:fail:auth denied') {
          wx.showToast({
            title: '需要授权位置信息',
            icon: 'none'
          });
          that.setData({
            authorized: false
          });
        }
      }
    });
  },

  fetchCategories: function () {
    const that = this;
    const AUrl = app.globalData.AUrl;
    wx.request({
      url: `${AUrl}/jy/go/we.aspx?ituid=106&itjid=5035&itcid=5035&id=01`,
      success(res) {
        if (res.data.code === '1' && res.data.result) {
          // 获取分类数据，并确保 children 存在
          let categories = res.data.result.goods.map(cat => ({
            ...cat,
            children: Array.isArray(cat.children) ? cat.children : []
          }));

          const updataArray = wx.getStorageSync('updataArray') || [];
          // 对 updataArray 按 id 分组统计商品数量（累加同 id 的数量）
          const groupedItems = that.groupItemsByQuantity(updataArray);

          // 合并逻辑：遍历每个分类的商品，如果缓存中存在，则把该 id 的数量累加后赋值到 num 属性上
          categories = categories.map(cat => ({
            ...cat,
            children: cat.children.map(item => {
              const groupItem = groupedItems[item.id];
              // 如果缓存中存在，则设置该商品的数量为相同 id 的累计数量
              if (groupItem) {
                return {
                  ...item,
                  num: groupItem.num,
                  // 其他属性也可以从 groupItem 取出
                  skuCode: groupItem.skuCode,
                  add: groupItem.add,
                  selectedSize: groupItem.selectedSize,
                  selectedTemperature: groupItem.selectedTemperature,
                  selectedSweetness: groupItem.selectedSweetness,
                };
              } else {
                return {
                  ...item,
                  num: 0
                };
              }
            })
          }));

          that.setData({
            categories
          });
          wx.setStorageSync('categories', categories);
        }
      }
    });
  },



  onSideBarChange(e) {
    const {
      value
    } = e.detail;
    this.setData({
      sideBarIndex: value,
      scrollTop: 0
    });
  },

  // handelChange(e) {
  //   let tempCategories = this.data.categories;
  //   const { id, dishId } = e.currentTarget.dataset;
  //   tempCategories[id - 1].children[dishId - 1].num = e.detail.value;
  //   let tempCount = 0;
  //   tempCategories[id - 1].children.forEach(item => {
  //     tempCount += parseInt(item.num, 10);
  //   });
  //   tempCategories[id - 1].badgeProps.count = tempCount;
  //   let tempSum = 0;
  //   tempCategories.forEach(item => {
  //     tempSum += parseInt(item.badgeProps.count, 10);
  //   });
  //   this.setData({
  //     categories: tempCategories,
  //     sum: tempSum
  //   });
  // },

  navigateToDianDan: function (e) {
    if (!wx.getStorageSync('isLoginSuccess')) {
      // wx.navigateTo({
      //   url: '/subPackages/user/pages/register/register',
      // })
      //return
     // wx.setStorageSync('itsid','[WXA]abc');
    }
    console.log(e);
    const dishId = e.currentTarget.dataset.dishid;
    const dish = this.data.categories.reduce((acc, category) => {
      if (category && category.children) {
        return acc || category.children.find(d => d.id === dishId);
      }
      return acc;
    }, null);

    if (dish) {
      const app = getApp();
      app.globalData.selectedDishName = dish.name;

      // 拼接完整的图片URL
      const fullImageURL = `${app.globalData.AUrl}/jy/wxUserImg/106/${dish.image}`;

      // 跳转到详情页，并传递完整的图片URL
      wx.navigateTo({
        url: `/subPackages/package/pages/diandan/diandan?image=${encodeURIComponent(fullImageURL)}&index1=${e.currentTarget.dataset.index1}&index2=${e.currentTarget.dataset.index2}&dishId=${dishId}`
      });
    } else {
      console.error('未找到对应的菜品信息');
      wx.showToast({
        title: '未找到菜品信息',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // gobackPublish() {
  //   wx.setStorageSync('categories', this.data.categories);
  //   wx.setStorageSync('dishSum', this.data.sum);
  //   wx.navigateTo({
  //     url: '/subPackages/package/pages/jiesuan/jiesuan',
  //   });
  // },



  onReady() { },

  onShow: function () {
    const categories = wx.getStorageSync('categories') || [];
    const updataArray = wx.getStorageSync('updataArray') || [];
    this.syncCategoriesFromUpdataArray(updataArray);
    const sum = wx.getStorageSync('sum') || 0;
    const totalprice = wx.getStorageSync('total') || 0; // 这里改名成 totalprice
    this.setData({
      categories,
      totalprice: this.countTotalPrice(),
      sum: updataArray.reduce((sum, item) => sum + item.num, 0)
    });
    this.getLocation();
    this.fetchCategories();
    this.setData({
      categories
    }, () => {
      // 在setData回调中确保数据更新后计算
      this.setData({
        totalprice: this.countTotalPrice()
      });
    });

    const selectedDishName = app.globalData.selectedDishName;
    console.log('选中的菜品名称:', selectedDishName);
    this.setData({
      selectedDishName: selectedDishName
    });


    // 确保此处没有拼写错误
    this.setData({
      selected: app.globalData.selected,
      address: app.globalData.addressDesc,
      storeName: app.globalData.selectedStoreName,
      totalprice: this.countTotalPrice() // 使用函数计算
    });
  },

  //   const tabBar = this.getTabBar();
  //   if (typeof tabBar.setData === 'function' && tabBar) {
  //     tabBar.setData({
  //       active: 1
  //     });
  //   }

  getLocation: function () {
    const that = this;
    const hasShownRecommendationPopup = wx.getStorageSync('hasShownRecommendationPopup');
    const selectedStoreName = app.globalData.selectedStoreName;

    if (hasShownRecommendationPopup || selectedStoreName) {
      console.log("用户已看过推荐弹窗或选择过门店，不再获取位置");
      return;
    }

    wx.getSetting({
      success(settingdata) {
        if (!settingdata.authSetting['scope.userLocation']) {
          // 用户未授权，提示用户并引导授权
          wx.authorize({
            scope: 'scope.userLocation',
            success() {
              that._getLocation();
            },
            fail() {
              wx.showToast({
                title: '需要授权位置信息',
                icon: 'none'
              });
            }
          });
        } else {
          that._getLocation();
        }
      }
    });
  },
  // 获取用户位置
  getLocation: function () {
    const that = this;
    wx.getLocation({
      type: 'wgs84', // 返回可以用于地图的经纬度
      success(res) {
        const {
          latitude,
          longitude
        } = res;
        console.log("获取到用户位置：", latitude, longitude);
        that.setData({
          latitude: latitude,
          longitude: longitude
        });
        that.getNearbyStores(latitude, longitude); // 调用获取附近门店
      },
      fail(err) {
        console.error("获取位置失败：", err);
        if (err.errMsg === 'getLocation:fail auth deny') {
          wx.showToast({
            title: '用户拒绝授权位置信息',
            icon: 'none'
          });
        } else {
          wx.showToast({
            title: '获取位置失败，请检查网络',
            icon: 'none'
          });
        }
      }
    });
  },

  // /**
  //  * 实际获取位置的逻辑
  //  */
  // _getLocation: function () {
  //   const that = this;
  //   wx.getLocation({
  //     type: 'wgs84', // 返回可以用于地图的经纬度
  //     success(res) {
  //       const {
  //         latitude,
  //         longitude
  //       } = res;
  //       console.log("获取到用户位置：", latitude, longitude);
  //       that.setData({
  //         latitude: latitude,
  //         longitude: longitude
  //       });

  //       // 调用后端接口获取附近门店
  //       that.getNearbyStores(latitude, longitude);
  //     },
  //     fail(err) {
  //       console.error("获取位置失败：", err);
  //       if (err.errMsg === 'getLocation:fail auth deny') {
  //         wx.showToast({
  //           title: '用户拒绝授权位置信息',
  //           icon: 'none'
  //         });
  //       } else {
  //         wx.showToast({
  //           title: '获取位置失败，请检查网络',
  //           icon: 'none'
  //         });
  //       }
  //     }
  //   });
  // },

  // // 获取附近门店1111111
  // getNearbyStores: function (latitude, longitude) {
  //   const that = this;
  //   const itsid = wx.getStorageSync('itsid'); // 从本地存储获取 itsid

  //   wx.request({
  //     url: `https://www.ruanzi.net/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10610&itsid= ${itsid}`,
  //     method: 'GET',
  //     data: {
  //       latitude: latitude,
  //       longitude: longitude
  //     },
  //     success(res) {
  //       if (res.data.code === '1' && res.data.result) {
  //         const stores = res.data.result.list; // 获取接口返回的门店数据
  //         const nearbyStores = that.calculateNearbyStores(latitude, longitude, stores); // 筛选附近门店
  //         console.log("附近门店数据：", nearbyStores); // 调试信息
  //         that.setData({
  //           nearbyStores // 更新页面数据
  //         });
  //       } else {
  //         wx.showToast({
  //           title: '未找到附近门店',
  //           icon: 'none'
  //         });
  //       }
  //     },
  //     fail(err) {
  //       console.error("请求失败:", err);
  //       wx.showToast({
  //         title: '请求失败，请检查网络',
  //         icon: 'none'
  //       });
  //     }
  //   });
  // },
  getNearbyStores: function (latitude, longitude) {
    const that = this;
    const hasShownRecommendationPopup = wx.getStorageSync('hasShownRecommendationPopup');
    const selectedStoreName = app.globalData.selectedStoreName;

    if (hasShownRecommendationPopup || selectedStoreName) {
      console.log("用户已看过推荐弹窗或选择过门店，不再查询附近门店");
      return;
    }
    const AUrl = app.globalData.AUrl;
    const itsid = wx.getStorageSync('itsid'); // 从本地存储获取 itsid

    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10626&itsid= ${itsid}`,
      method: 'GET',
      data: {
        latitude: latitude,
        longitude: longitude
      },
      success(res) {
        if (res.data.code === '1' && res.data.result) {
          const stores = res.data.result.list; // 获取接口返回的门店数据
          const nearestStore = that.findNearestStore(latitude, longitude, stores); // 找到最近的门店
          console.log(nearestStore);
          // 设置推荐的门店并显示弹窗
          that.setData({
            storeName: nearestStore.name,
            recommendedStore: nearestStore, // 设置推荐的门店
            showRecommendationPopup: true // 显示弹窗
          });
          app.globalData.selectedStoreName = nearestStore.name
          wx.setStorageSync('selectedStoreId', nearestStore.id)
          console.log("最近的门店数据：", nearestStore); // 调试信息
        } else {
          wx.showToast({
            title: '未找到附近门店',
            icon: 'none'
          });
        }
      },
      fail(err) {
        console.error("请求失败:", err);
        wx.showToast({
          title: '请求失败，请检查网络',
          icon: 'none'
        });
      }
    });
  },
  findNearestStore: function (latitude, longitude, stores) {
    console.log(latitude, longitude, stores);
    const R = 6371; // 地球半径（单位：公里）
    let nearestStore = null;
    let minDistance = Infinity;

    stores.forEach(store => {
      const storeLatitude = parseFloat(store.latitude);
      const storeLongitude = parseFloat(store.longitude);
      const distance = this.calculateDistance(latitude, longitude, storeLongitude, storeLatitude);

      if (distance < minDistance) {
        minDistance = distance;
        nearestStore = {
          ...store,
          distance: distance.toFixed(2) // 保留两位小数
        };
      }
    });

    return nearestStore;
  },
  // 计算附近门店
  calculateNearbyStores: function (latitude, longitude, stores) {
    const nearbyStores = [];
    const R = 6371; // 地球半径（单位：公里）

    stores.forEach(store => {
      const storeLatitude = parseFloat(store.latitude);
      const storeLongitude = parseFloat(store.longitude);
      const distance = this.calculateDistance(latitude, longitude, storeLongitude, storeLatitude);

      if (distance <= 10) { // 筛选10公里内的门店
        nearbyStores.push({
          ...store,
          distance: distance.toFixed(2) // 保留两位小数
        });
      }
    });

    return nearbyStores;
  },

  // Haversine 公式计算距离
  rad(d) {
    return d * Math.PI / 180.0
  },
  calculateDistance: function (lat1, lng1, lat2, lng2) {
    console.log(lat1, lng1, lat2, lng2);
    // const R = 6371; // 地球半径（单位：公里）
    // const dLat = (lat2 - lat1) * Math.PI / 180;
    // const dLon = (lon2 - lon1) * Math.PI / 180;
    // const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    //   Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    //   Math.sin(dLon / 2) * Math.sin(dLon / 2);
    // const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // return R * c; // 返回距离（单位：公里）
    var radLat1 = this.rad(lat1);
    var radLat2 = this.rad(lat2);
    var a = radLat1 - radLat2;
    var b = this.rad(lng1) - this.rad(lng2);
    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378.137; // EARTH_RADIUS;
    s = Math.round(s * 10000) / 10000; //输出为公里
    var distance = s;
    var distance_str = "";
    if (parseInt(distance) >= 1) {
      distance_str = distance.toFixed(1) + "km";
    } else {
      distance_str = distance * 1000 + "m";
    }
    console.info('距离是', s);
    console.info('距离是', distance_str);
    return s;
  },
  navigateToStore: function () {
    const {
      recommendedStore
    } = this.data;
    if (!recommendedStore) {
      wx.showToast({
        title: '未找到推荐门店',
        icon: 'none'
      });
      return;
    }

    // 调起微信导航
    wx.openLocation({
      latitude: parseFloat(recommendedStore.longitude),
      longitude: parseFloat(recommendedStore.latitude),
      name: recommendedStore.name,
      address: recommendedStore.add,
      success: function () {
        console.log('导航成功');
      },
      fail: function (err) {
        console.error('导航失败:', err);
        wx.showToast({
          title: '导航失败',
          icon: 'none'
        });
      }
    });
  },


  // 选择推荐的门店
  selectRecommendedStore: function () {
    const {
      recommendedStore
    } = this.data;

    // 更新全局变量
    app.globalData.selectedStoreName = recommendedStore.name;
    app.globalData.selectedStoreId = recommendedStore.id;

    // 更新页面数据
    this.setData({
      storeName: recommendedStore.name, // 同步门店名称
      showRecommendationPopup: false // 关闭弹窗
    });

    // 设置标志，表示已经显示过推荐弹窗
    wx.setStorageSync('hasShownRecommendationPopup', true);

    wx.showToast({
      title: `已选择自提门店：${recommendedStore.name}`,
      icon: 'success'
    });
  },

  closeRecommendationPopup: function () {
    this.setData({
      showRecommendationPopup: false
    });

    // 设置标志，表示已经显示过推荐弹窗
    wx.setStorageSync('hasShownRecommendationPopup', true);
  },



  // 点击购物袋图片时调用
  toggleCartPopup: function () {
    const updataArray = wx.getStorageSync('updataArray') || [];
    const cartItems = this.getCartItemsFromUpdataArray(updataArray); // 使用 updataArray 提取数据
    this.setData({
      cartItems,
      totalprice: this.countTotalPrice(),
      showCartPopup: !this.data.showCartPopup
    });
  },
  // 新增方法：从categories提取购物车数据
  getCartItemsFromUpdataArray: function (updataArray) {
    return updataArray
      .filter(item => item.num > 0)
      .map(item => ({
        ...item,
        specs: item.specs || {} // 确保 specs 存在
      }));
  },

  // 关闭弹窗
  countTotalPrice: function (categories) {
    return (categories || this.data.categories)
      .flatMap(category => category.children || [])
      .reduce((total, item) => {
        const num = Number(item.num) || 0;
        const price = Number(item.price) || 0;
        return total + (num * price);
      }, 0)
      .toFixed(2);
  },
  // 增加商品数量
  // 增加数量（购物车与分类页面同时更新）
  onIncrease: function (e) {
    const skuCode = e.currentTarget.dataset.skucode;
    const updataArray = wx.getStorageSync('updataArray') || [];
    // 根据 skuCode 查找该商品记录的索引
    const itemIndex = updataArray.findIndex(item => item.skuCode === skuCode);
    if (itemIndex !== -1) {
      // 更新该 skuCode 对应的商品数量
      updataArray[itemIndex] = {
        ...updataArray[itemIndex],
        num: updataArray[itemIndex].num + 1
      };
      // 同步更新分类页面（分组求和）
      this.syncCategoriesFromUpdataArray(updataArray);
      // 更新缓存、购物车弹窗数据、总价和总数
      this.syncCartData(updataArray);
      this.setData({
        cartItems: this.getCartItemsFromUpdataArray(updataArray)
      });
    }
  },

  // 减少数量
  onDecrease: function (e) {
    const skuCode = e.currentTarget.dataset.skucode;
    const updataArray = wx.getStorageSync('updataArray') || [];
    const itemIndex = updataArray.findIndex(item => item.skuCode === skuCode);
    if (itemIndex !== -1) {
      updataArray[itemIndex] = {
        ...updataArray[itemIndex],
        num: Math.max(updataArray[itemIndex].num - 1, 0)
      };
      this.syncCategoriesFromUpdataArray(updataArray);
      this.syncCartData(updataArray);
      this.setData({
        cartItems: this.getCartItemsFromUpdataArray(updataArray)
      });
    }
  },

  // 同步购物车数据和缓存
  syncCartData: function (updataArray) {
    // 更新缓存
    wx.setStorageSync('updataArray', updataArray);
    const sum = updataArray.reduce((sum, item) => sum + (item.num || 0), 0);
    wx.setStorageSync('sum', sum);
    const total = this.countTotalPrice();
    wx.setStorageSync('total', total);

    // 同步更新视图，包括购物车弹窗的数据（cartItems）和其他显示数据
    this.setData({
      sum: sum,
      totalprice: total,
      // 重新计算购物车内具体的 item 数组
      cartItems: this.getCartItemsFromUpdataArray(updataArray)
    });

    // 同步更新分类页面数据
    this.syncCategoriesFromUpdataArray(updataArray);
  },

  // 更新 updataArray
  updateUpdataArray: function (cartItems) {
    const updataArray = wx.getStorageSync('updataArray') || [];
    cartItems.forEach(item => {
      // 同时比较 id 和 skuCode，确保相同 id 但不同 skuCode 的商品不会被覆盖
      const existingIndex = updataArray.findIndex(upItem =>
        upItem.id === item.id && upItem.skuCode === item.skuCode
      );
      if (existingIndex !== -1) {
        updataArray[existingIndex] = item; // 更新现有项
      } else {
        updataArray.push(item); // 添加新项
      }
    });
    return updataArray;
  },



  // 总价计算方法
  countTotalPrice: function () {
    const updataArray = wx.getStorageSync('updataArray') || [];
    let totalPrice = 0;

    updataArray.forEach(item => {
      const num = Number(item.num) || 0;
      const price = Number(item.price) || 0;
      totalPrice += num * price;
    });

    return totalPrice.toFixed(2); // 返回格式化后的总价
  },
  // 点击商品图片跳转到详情页，详情页可修改所选杯型、温度和甜度等信息
  // navigateToDetail: function (e) {
  //   const id = e.currentTarget.dataset.id;
  //   const selectedSize = e.currentTarget.dataset.size;
  //   const selectedTemperature = e.currentTarget.dataset.temperature;
  //   const selectedSweetness = e.currentTarget.dataset.sweetness;
  //   const image = e.currentTarget.dataset.image;
  //   const index1 = e.currentTarget.dataset.index1;
  //   const index2 = e.currentTarget.dataset.index2;
  //   const fullImageURL = `https://www.ruanzi.net/jy/wxUserImg/106/ ${image}`

  //   console.log('传递的 index1:', index1);
  //   console.log('传递的 index2:', index2);

  //   wx.navigateTo({
  //     url: `/subPackages/package/pages/diandan/diandan?dishId=${id}&image=${encodeURIComponent( fullImageURL)}&selectedSize=${selectedSize}&selectedTemperature=${selectedTemperature}&selectedSweetness=${selectedSweetness}&index1=${index1}&index2=${index2}`
  //   });
  // },
  onHide() { },

  onUnload() { },

  onPullDownRefresh() { },

  onReachBottom() { },

  onShareAppMessage() { }
});