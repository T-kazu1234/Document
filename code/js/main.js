function test(result){

    new Vue({
  
          el: '#app',
            data: {
              url:[
                result[0].url,
                result[1].url,
                result[2].url,
                result[3].url,
                result[4].url,
                result[5].url,
                result[6].url,
                result[7].url,
                result[8].url,
                result[9].url,
                result[10].url,
                result[11].url,
              ],
              image:[
                result[0].image,
                result[1].image,
                result[2].image,
                result[3].image,
                result[4].image,
                result[5].image,
                result[6].image,
                result[7].image,
                result[8].image,
                result[9].image,
                result[10].image,
                result[11].image,
              ],
              AppMenuName:[
                result[0].AppMenuName,
                result[1].AppMenuName,
                result[2].AppMenuName,
                result[3].AppMenuName,
                result[4].AppMenuName,
                result[5].AppMenuName,
                result[6].AppMenuName,
                result[7].AppMenuName,
                result[8].AppMenuName,
                result[9].AppMenuName,
                result[10].AppMenuName,
                result[11].AppMenuName,
              ],
            },
      });
  }
  
  fetch(
    "https://script.google.com/macros/s/AKfycbwPt5a6k01uy5rj1ezexTtXMduRzudK3HZEzMm_dug_uV4ZXCk/exec",
    )
  .then(res => res.json())
  .then(result => {
    console.log(result);
    test(result);
  }
  );
  