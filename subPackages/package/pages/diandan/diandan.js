const app = getApp();
Page({
  data: {
    // selectedSize: '大杯',
    // selectedTemperature: '冰',
    // selectedSweetness: '不另外加糖',
    // displaySize: '大杯',
    // displayTemperature: '冰',
    // displaySweetness: '不另外加糖',
    displaySettings: {},
    currentImage: '', // 用于存储当前显示的图片URL
    quantity: 1,
    dishName: '',
    isFavorited: false, // 添加收藏状态字段
    selectedSpecs: {}, // 使用对象存储所有规格选择
    dishId: '', // 假设每个饮品有一个唯一的ID
    mainPictures: [], // 商品主图集合[2,3](@ref)
    specs: [], // 规格属性集合[2](@ref)
    selectedSpecs: {}, // 已选规格组合
    currentPrice: 0, // 当前价格
    oldPrice: 0, // 原价（用于划线价）
    skuList: [],
    inventory: 0,
    targetSkuCode: '',


  },
  onDecrease: function () {
    const index1 = this.data.index1;
    const index2 = this.data.index2;

    // 确保索引是有效的数字
    if (typeof index1 !== 'number' || typeof index2 !== 'number') {
      console.error('索引无效:', index1, index2);
      return;
    }

    let newQuantity = this.data.quantity - 1;
    if (newQuantity < 1) newQuantity = 0;
    this.setData({
      quantity: newQuantity
    });

    // 同步更新 categories 和 updataArray
    const categories = this.data.categories;
    const keyPath = `categories[${index1}].children[${index2}].num`;
    this.setData({
      [keyPath]: newQuantity
    });

    // 更新 updataArray
    const updataArray = this.updateUpdataArray(categories, index1, index2, newQuantity);
    wx.setStorageSync('updataArray', updataArray);

    // 更新缓存
    wx.setStorageSync('categories', categories);
    wx.setStorageSync('sum', this.countSum());
    wx.setStorageSync('total', this.countTotalPrice());
  },

  onIncrease: function () {
    const index1 = this.data.index1;
    const index2 = this.data.index2;

    // 确保索引是有效的数字
    if (typeof index1 !== 'number' || typeof index2 !== 'number') {
      console.error('索引无效:', index1, index2);
      return;
    }

    const newQuantity = this.data.quantity + 1;
    this.setData({
      quantity: newQuantity
    });

    // 同步更新 categories 和 updataArray
    const categories = this.data.categories;
    const keyPath = `categories[${index1}].children[${index2}].num`;
    this.setData({
      [keyPath]: newQuantity
    });

    // 更新 updataArray
    const updataArray = this.updateUpdataArray(categories, index1, index2, newQuantity);
    wx.setStorageSync('updataArray', updataArray);

    // 更新缓存
    wx.setStorageSync('categories', categories);
    wx.setStorageSync('sum', this.countSum());
    wx.setStorageSync('total', this.countTotalPrice());
  },

  // 更新 updataArray
  updateUpdataArray: function (categories, index1, index2, newQuantity) {
    const updataArray = wx.getStorageSync('updataArray') || [];
    const item = categories[index1].children[index2];
    item.num = newQuantity;

    const existingIndex = updataArray.findIndex(upItem => upItem.id === item.id);
    if (existingIndex !== -1) {
      updataArray[existingIndex] = item; // 更新现有项
    } else {
      updataArray.push(item); // 添加新项
    }

    return updataArray;
  },

  onLoad: function (options) {
    const dishId = options.dishId;
    const index1 = parseInt(options.index1, 10);
    const index2 = parseInt(options.index2, 10);
    const userid = 0;

    // 确保索引是有效的数字
    if (isNaN(index1) || isNaN(index2)) {
      console.error('索引无效:', index1, index2);
      return;
    }

    this.setData({
      dishId: dishId,
      currentImage: decodeURIComponent(options.image),
      index1: index1,
      index2: index2
    });

    // 从缓存中获取最新的 categories 数据
    const categories = wx.getStorageSync('categories') || [];
    this.setData({
      categories: categories
    });
    const cachedPrice = wx.getStorageSync(`currentPrice_${dishId}`) || 0;
    const cachedOldPrice = wx.getStorageSync(`oldPrice_${dishId}`) || 0;

    this.setData({
      currentPrice: cachedPrice,
      oldPrice: cachedOldPrice
    });
    // 从本地缓存中读取当前饮品的选择
    const savedSelections = wx.getStorageSync(`savedSelections_${dishId}`) || {};
    const isFavorited = wx.getStorageSync(`isFavorited_${dishId}`) || false;

    this.setData({
      selectedSize: savedSelections.selectedSize || '大杯',
      selectedTemperature: savedSelections.selectedTemperature || '冰',
      selectedSweetness: savedSelections.selectedSweetness || '不另外加糖',
      displaySize: savedSelections.selectedSize || '大杯',
      displayTemperature: savedSelections.selectedTemperature || '冰',
      displaySweetness: savedSelections.selectedSweetness || '不另外加糖',
      isFavorited: isFavorited
    });

          wx.request({
        // url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10638&itcid=10638&keyvalue=${dishId}&itsid=${itsid}`,
        url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10638&itcid=10638&userid=${userid}&keyvalue=${dishId}`,
      method: 'GET',
      success: (res) => {
        const {
          mainPictures,//图片
          specs,//规格
          skus,
          price,
          oldPrice,
          name
        } = res.data.result
        console.log('接口返回的specs:', res.data.result.specs);

        // 转换规格数据[6](@ref)
        const specList = specs.map(spec => ({
          name: spec.name,
          list: spec.values.map(value => ({
            name: value.name,
            picture: value.picture // 保留规格图片字段[2](@ref)
          }))
        }))

        // 转换SKU数据[6](@ref)
        const skuList = skus.map(sku => {
          // 将 SKU 的规格转换为 {规格名: 值} 的映射
          const specMap = {};
          sku.specs.forEach(spec => {
            specMap[spec.name] = spec.valueName;
          });

          return {
            _id: sku.id,
            goods_id: res.data.result.id,
            image: sku.picture || mainPictures[0],
            price: Math.round(sku.price * 100),
            oldPrice: Math.round(sku.oldPrice * 100),
            skuCode: sku.skuCode,
            sku_name_arr: specs.map(spec => specMap[spec.name]), // 关键修改
            stock: sku.inventory,
            rawSpecs: sku.specs // 保留原始数据用于调试
          };
        });

        this.setData({
          mainPictures: mainPictures.slice(0, 9),
          specs, // ← 把原始 specs 存到 data.specs
          specList,
          skuList,
          currentPrice: price,
          oldPrice,
          dishName: name,
        });

        this.initDefaultSpecs(() => {
          const savedSpecs = wx.getStorageSync(`savedSpecs_${dishId}`) || {};
          const isFavorited = wx.getStorageSync(`isFavorited_${dishId}`) || false;

          if (isFavorited) {
            this.validateAndApplySavedSpecs(savedSpecs, () => {
              this.setData({
                isFavorited: true,
                selectedSpecs: savedSpecs
              });
              this.matchSku();
              // 加载收藏状态
              this.loadFavoriteStatus();
            });
          } else {
            this.matchSku();
          }
        });
      }
    })
  },
  // 验证收藏的规格是否有效
  validateAndApplySavedSpecs(savedSpecs, callback) {
    const {
      skuList,
      specList
    } = this.data;

    // 检查每个收藏的规格是否在可用选项中
    const validSpecs = {};
    let isValid = true;

    specList.forEach(spec => {
      const savedValue = savedSpecs[spec.name];
      const validValues = spec.list.map(v => v.name);

      if (savedValue && validValues.includes(savedValue)) {
        validSpecs[spec.name] = savedValue;
      } else {
        isValid = false;
      }
    });

    if (isValid) {
      // 检查是否有对应SKU
      const matched = skuList.find(sku =>
        Object.entries(validSpecs).every(([name, value]) =>
          sku.sku_name_arr.includes(value)
        ) && sku.stock > 0
      );

      if (matched) {
        this.setData({
          selectedSpecs: validSpecs
        }, callback);
        return;
      }
    }

    // 如果收藏规格无效，回退默认规格
    this.initDefaultSpecs(callback);
  },

  // 初始化默认规格[8](@ref)
  initDefaultSpecs(callback) {
    const {
      specList,
      skuList
    } = this.data;
    const selectedSpecs = {};

    specList.forEach(spec => {
      const defaultVal = spec.list.find(v =>
        skuList.some(sku =>
          sku.sku_name_arr.includes(v.name) && sku.stock > 0
        )
      )?.name || spec.list[0]?.name;

      selectedSpecs[spec.name] = defaultVal;
    });

    this.setData({
      selectedSpecs
    }, () => {
      this.updateDisplaySettings();
      if (callback) callback();
    });
  },
  updateDisplaySettings() {
    const displaySettings = {};
    Object.entries(this.data.selectedSpecs).forEach(([specName, specValue]) => {
      displaySettings[specName] = specValue;
    });
    this.setData({
      displaySettings
    });
  },
  // 规格选择事件[2,6](@ref)
  onSelectSpec(e) {
    const {
      specname,
      valuename
    } = e.currentTarget.dataset;

    // 直接更新 selectedSpecs
    this.setData({
      [`selectedSpecs.${specname}`]: valuename
    }, () => {
      this.matchSku();
      // 更新本地价格缓存
      wx.setStorageSync(`currentPrice_${this.data.dishId}`, this.data.currentPrice);
      wx.setStorageSync(`oldPrice_${this.data.dishId}`, this.data.oldPrice);
      this.forceUpdateSpecs();
      // 更新收藏状态
      this.updateFavoriteStatus();
    });
  },
  // 更新收藏状态
  updateFavoriteStatus() {
    const {
      dishId,
      selectedSpecs
    } = this.data;
    const savedSpecs = wx.getStorageSync(`savedSpecs_${dishId}`) || {};

    // 检查当前选中的规格是否与收藏的规格一致
    const isSameSpecs = Object.entries(selectedSpecs).every(([key, value]) => savedSpecs[key] === value);

    if (isSameSpecs) {
      // 如果当前选中的规格与收藏的规格一致，更新为收藏状态
      this.setData({
        isFavorited: true
      });
    } else {
      // 否则更新为未收藏状态
      this.setData({
        isFavorited: false
      });
    }
  },

  // 加载收藏状态
  loadFavoriteStatus() {
    const {
      dishId,
      selectedSpecs
    } = this.data;
    const savedSpecs = wx.getStorageSync(`savedSpecs_${dishId}`) || {};

    // 检查当前选中的规格是否与收藏的规格一致
    const isSameSpecs = Object.entries(selectedSpecs).every(([key, value]) => savedSpecs[key] === value);

    if (isSameSpecs) {
      // 如果一致，设置为收藏状态
      this.setData({
        isFavorited: true
      });
    }
  },
  forceUpdateSpecs() {
    const tempSpecs = {
      ...this.data.selectedSpecs
    };
    this.setData({
      selectedSpecs: tempSpecs
    });
  },
  // 匹配对应SKU[6](@ref)
  matchSku() {
    const {
      skuList,
      selectedSpecs,
      specList
    } = this.data;
    const selectedValues = specList.map(spec => selectedSpecs[spec.name] || null);
    // 完全匹配算法
    const matchedSku = skuList.find(sku => {
      return sku.sku_name_arr.every((value, index) => {
        // 未选择的规格跳过验证
        if (!selectedValues[index]) return true;
        return value === selectedValues[index];
      });
    });
    console.log(matchedSku);
    this.setData({
      oldPrice: matchedSku?.oldPrice / 100 || 0,
      currentPrice: matchedSku?.price / 100 || 0,
      inventory: matchedSku?.stock || 0,
      currentImage: matchedSku?.image || this.data.mainPictures[0],
      targetSkuCode: matchedSku.skuCode // 发送请求的目标skuCode
    });
    if (matchedSku) {
      wx.setStorageSync(`currentPrice_${this.data.dishId}`, matchedSku.price / 100);
      wx.setStorageSync(`oldPrice_${this.data.dishId}`, matchedSku.oldPrice / 100);
    }
  },

  selectSize: function (e) {
    const dishId = this.data.dishId;
    const selectedSize = e.currentTarget.dataset.size;
    this.setData({
      selectedSize: selectedSize,
      displaySize: selectedSize
    });
    // 保存选择到本地缓存
    const savedSelections = wx.getStorageSync(`savedSelections_${dishId}`) || {};
    savedSelections.selectedSize = selectedSize;
    wx.setStorageSync(`savedSelections_${dishId}`, savedSelections);
  },

  selectTemperature: function (e) {
    const dishId = this.data.dishId;
    const selectedTemperature = e.currentTarget.dataset.temperature;
    this.setData({
      selectedTemperature: selectedTemperature,
      displayTemperature: selectedTemperature
    });
    // 保存选择到本地缓存
    const savedSelections = wx.getStorageSync(`savedSelections_${dishId}`) || {};
    savedSelections.selectedTemperature = selectedTemperature;
    wx.setStorageSync(`savedSelections_${dishId}`, savedSelections);
  },

  selectSweetness: function (e) {
    const dishId = this.data.dishId;
    const selectedSweetness = e.currentTarget.dataset.sweetness;
    this.setData({
      selectedSweetness: selectedSweetness,
      displaySweetness: selectedSweetness
    });
    // 保存选择到本地缓存
    const savedSelections = wx.getStorageSync(`savedSelections_${dishId}`) || {};
    savedSelections.selectedSweetness = selectedSweetness;
    wx.setStorageSync(`savedSelections_${dishId}`, savedSelections);
  },
  // onFavorite: function () {
  //   const dishId = this.data.dishId;
  //   const isFavorited = !this.data.isFavorited;
  //   const itsid = wx.getStorageSync('itsid') || 'default_itsid'; // 获取itsid
  //   const app = getApp(); // 获取全局对象
  //   const userid = wx.getStorageSync('userid');
  //   const backUrl = app.globalData.backUrl;
  //   if (isFavorited) {
  //     // 保存当前规格组合
  //     wx.setStorageSync(`savedSpecs_${dishId}`, this.data.selectedSpecs);
  //     wx.setStorageSync(`isFavorited_${dishId}`, true);
  //     wx.showToast({
  //       title: '收藏成功',
  //       icon: 'success'
  //     });

  //     // 发送 POST 请求到接口 10636


  //     // keyid等于dishId
  //     wx.request({
  //       url: `${backUrl}phone.aspx?mbid=10636&ituid=${app.globalData.ituid}&itsid=${itsid}`,
  //       method: 'POST',
  //       data: {
  //         value: this.data.dishId,
  //         userid: userid,
  //         macode: this.data.targetSkuCode
  //       },
  //       header: {
  //         'content-type': 'application/json' // 默认值
  //       },
  //       success: (res) => {
  //         console.log('收藏接口成功:', res.data);
  //         // 可以在这里处理接口返回的数据
  //       },
  //       fail: (err) => {
  //         console.error('收藏接口失败:', err);
  //         // 处理接口请求失败的情况
  //       }
  //     });
  //   } else {
  //     wx.removeStorageSync(`savedSpecs_${dishId}`);
  //     wx.setStorageSync(`isFavorited_${dishId}`, false);
  //     wx.showToast({
  //       title: '取消收藏',
  //       icon: 'none'
  //     });

  //     // 如果需要在取消收藏时发送请求，可以在这里添加相应的逻辑
  //   }

  //   this.setData({
  //     isFavorited
  //   });
  // },

  onFavorite: function () {
    const {
      dishId,
      isFavorited,
      targetSkuCode
    } = this.data;
    const userid = wx.getStorageSync('userid');
    const backUrl = app.globalData.backUrl;
    const itsid = wx.getStorageSync('itsid') || 'default_itsid';

    if (isFavorited) {
      // 取消收藏时调用接口 10637
      wx.request({
        url: `${backUrl}phone.aspx?mbid=10637&ituid=${app.globalData.ituid}&itsid=${itsid}`,
        method: 'POST',
        data: {
          value: dishId,

        },
        success: (res) => {
          if (res.statusCode === 200) {
            wx.showToast({
              title: "取消收藏",
              icon: 'none'
            });
            this.setData({
              isFavorited: false
            });
            wx.setStorageSync(`isFavorited_${dishId}`, false);
            wx.removeStorageSync(`savedSpecs_${dishId}`);
          } else {
            wx.showToast({
              title: '取消收藏失败',
              icon: 'none'
            });
          }
        },
        fail: () => wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      });
    } else {
      // 收藏时调用接口 10636
      wx.request({
        url: `${backUrl}phone.aspx?mbid=10636&ituid=${app.globalData.ituid}&itsid=${itsid}`,
        method: 'POST',
        data: {
          value: dishId,
          userid,
          macode: targetSkuCode
        },
        success: (res) => {
          if (res.statusCode === 200) {
            wx.showToast({
              title: "收藏成功",
              icon: 'none'
            });
            this.setData({
              isFavorited: true
            });
            wx.setStorageSync(`isFavorited_${dishId}`, true);
            wx.setStorageSync(`savedSpecs_${dishId}`, this.data.selectedSpecs);
          } else {
            wx.showToast({
              title: '收藏失败',
              icon: 'none'
            });
          }
        },
        fail: () => wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      });
    }
  },

  // 遍历categories计算出总杯数算法
  countSum() {
    const updataArray = wx.getStorageSync('updataArray') || [];
    const sumMap = new Map();

    // 按 skuCode 聚合数量
    updataArray.forEach(item => {
      const key = item.skuCode + JSON.stringify(item.specs);
      sumMap.set(key, (sumMap.get(key) || 0) + item.num);
    });

    return Array.from(sumMap.values()).reduce((a, b) => a + b, 0);
  },
  //总价
  countTotalPrice() {
    const updataArray = wx.getStorageSync('updataArray') || [];
    return updataArray.reduce((total, item) => {
      // 使用实际存储的价格计算
      return total + (item.num || 0) * (item.price || 0);
    }, 0);
  },
  // 更新规格显示的方法
  updateDisplaySettings() {
    const displaySpecs = [];
    Object.entries(this.data.selectedSpecs).forEach(([specName, specValue]) => {
      displaySpecs.push({
        name: specName,
        value: specValue
      });
    });
    this.setData({
      displaySpecs: displaySpecs
    });
  },

  // 加入购物车
  goBackOrder() {
    // 检查用户是否已登录
    const userid = wx.getStorageSync('userid');
    if (!userid) {
      // 保存当前商品参数，用于登录后回跳
      const currentPage = getCurrentPages();
      const currentRoute = currentPage[currentPage.length-1].route;
      const options = {
        dishId: this.data.dishId,
        index1: this.data.index1,
        index2: this.data.index2,
        action: 'addToCart' // 标记用户操作为加入购物车
      };
      
      // 将参数编码为URL参数
      const urlParams = Object.keys(options).map(key => `${key}=${options[key]}`).join('&');
      
      // 跳转到登录页面，并传递回调参数
      wx.navigateTo({
        url: `/subPackages/user/pages/register/register?callback=/${currentRoute}&${urlParams}`
      });
      return;
    }
    
    const skuCode = this.data.targetSkuCode;
    const {
      selectedSpecs,
      specList
    } = this.data;

    // 生成规格描述（根据接口返回的规格顺序）
    const displaySettings = specList.map(spec =>
      `${spec.name}:${selectedSpecs[spec.name]}`
    ).join('; ');
    
    const tempCategories = this.data.categories;
    const currentQuantity = Number(this.data.quantity);
    // 获取当前选中的商品对象
    let currentItem = tempCategories[this.data.index1].children[this.data.index2];
    // 新增价格存储
    currentItem.price = this.data.currentPrice; // 当前规格价格
    currentItem.oldPrice = this.data.oldPrice; // 原价
    currentItem.skuCode = skuCode; // 新增SKU唯一标识字段[1](@ref)
    // 保存附加选项到对象中
    currentItem.add = displaySettings;
    // 保存详细选项
    currentItem.specs = {
      ...selectedSpecs
    }; // 存储规格对象
    // currentItem.image = this.data.currentImage;

    let updataArray = wx.getStorageSync('updataArray') || [];

    // 用商品ID和附加设置来判断是否为同一商品
    const existingIndex = updataArray.findIndex(item =>
      item.skuCode === skuCode &&
      this.compareSpecs(item.specs, selectedSpecs) // 调用 compareSpecs 方法
    );
    if (existingIndex !== -1) {
      const newQuantity = Number(updataArray[existingIndex].num) + currentQuantity;
      updataArray[existingIndex].num = newQuantity;
      currentItem.num = newQuantity;
    } else {
      currentItem.num = currentQuantity;
      updataArray.push(currentItem);
    }

    wx.setStorageSync('updataArray', updataArray);

    wx.setStorageSync('categories', tempCategories);
    console.log('categories', tempCategories);
    wx.setStorageSync('updataArray', updataArray);

    const totalSum = this.countSum();
    const totalPrice = this.countTotalPrice();
    wx.setStorageSync('sum', totalSum);
    wx.setStorageSync('total', totalPrice);

    // 返回商品点单页面
    wx.switchTab({
      url: '/pages/order/order'
    });

    // //返回上一页
    // wx.navigateBack({
    //   delta:1
    //    });
  },


  compareSpecs(specs1, specs2) {
    if (!specs1 || !specs2) return false;
    if (Object.keys(specs1).length !== Object.keys(specs2).length) return false;

    for (const key in specs1) {
      if (specs1[key] !== specs2[key]) return false;
    }

    return true;
  },
  
  // 立即购买功能
  goToJiesuanNow: function() {
    // 检查用户是否已登录
    const userid = wx.getStorageSync('userid');
    if (!userid) {
      // 保存当前商品参数，用于登录后回跳
      const currentPage = getCurrentPages();
      const currentRoute = currentPage[currentPage.length-1].route;
      const options = {
        dishId: this.data.dishId,
        index1: this.data.index1,
        index2: this.data.index2,
        action: 'buyNow' // 标记用户操作为立即购买
      };
      
      // 将参数编码为URL参数
      const urlParams = Object.keys(options).map(key => `${key}=${options[key]}`).join('&');
      
      // 跳转到登录页面，并传递回调参数
      wx.navigateTo({
        url: `/subPackages/user/pages/register/register?callback=/${currentRoute}&${urlParams}`
      });
      return;
    }
    
    const skuCode = this.data.targetSkuCode;
    const {selectedSpecs, specList} = this.data;
    
    // 生成规格描述（根据接口返回的规格顺序）
    const displaySettings = specList.map(spec =>
      `${spec.name}:${selectedSpecs[spec.name]}`
    ).join('; ');
    
    // 创建一个专门用于立即购买的商品对象
    const currentItem = {
      id: this.data.dishId,
      name: this.data.dishName,
      image: this.data.currentImage,
      price: this.data.currentPrice,
      oldPrice: this.data.oldPrice,
      skuCode: skuCode,
      add: displaySettings,
      num: this.data.quantity,  // 当前选择的数量
      specs: {...selectedSpecs}, // 添加完整规格对象
      ask: displaySettings
    };
    
    // 保存到本地缓存，用于结算页面读取
    wx.setStorageSync('buyNowItems', [currentItem]);
    
    // 跳转到立即购买结算页面
    wx.navigateTo({
      url: '/subPackages/package/pages/jiesuan-now/jiesuan-now'
    });
  },
  
  onShow: function () {
    // 确保每次页面显示时，都从缓存中获取最新的数据
    const categories = wx.getStorageSync('categories') || [];
    const updataArray = wx.getStorageSync('updataArray') || [];
    const sum = wx.getStorageSync('sum') || 0;
    const total = wx.getStorageSync('total') || 0;

    this.setData({
      categories: categories,
      updataArray: updataArray,
      sum: sum,
      totalprice: total
    });

    const app = getApp();
    const selectedDishName = app.globalData.selectedDishName;
    console.log('选中的菜品名称:', selectedDishName);
    this.setData({
      selectedDishName: selectedDishName
    });
  }

});
