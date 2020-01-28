enchant()

window.onload = function(){
    var core = new Core(1400,1400)
    core.preload('tail.png','back_hair.png','right_leg.png','left_leg.png')
    core.preload('right_hand.png','left_hand.png','body.png','face.png')
    core.preload('right_arm.png','left_arm.png','body.png','face.png')
    core.preload('fur.png','right_wing.png','left_wing.png','bangs.png')
    core.preload('right_hair.png','left_hair.png','Blue_back.png')
    core.preload('eye.png','Back_Baird.png','Ground.png')
    core.fps = 100
    core.onload = function(){
        
        var eee=1
        var time=0
        var iii=1
        var face1 = 1
        var ggg=0
        var spead=0
        var syosoku=0
        var gra = 5//重力加速度
        var e = 0.3//反発係数
        
        //枠の初期設定
        var Blue_back = new Sprite(1250,1250)
        Blue_back.image = core.assets['Blue_back.png']
        Blue_back.x = 100
        Blue_back.y = 100
        core.rootScene.addChild(Blue_back)

        //尻尾の初期設定
        var tail = new Sprite(350,250)
        tail.image = core.assets['tail.png']
        tail.x = 217+350
        tail.y = 699-800
        core.rootScene.addChild(tail)
        
        //後ろ髪の初期設定
        var back_hair = new Sprite(400,300)
        back_hair.image = core.assets['back_hair.png']
        back_hair.x = tail.x-60
        back_hair.y = tail.y-405
        core.rootScene.addChild(back_hair)
        
        //右脚の初期設定
        var right_leg = new Sprite(200,926)
        var syosoku_t = 0
        var spead_t=0
        var ggg_t = 0
        right_leg.image = core.assets['right_leg.png']
        right_leg.x = tail.x-13
        right_leg.y = tail.y-316
        core.rootScene.addChild(right_leg)
        
        //左脚の初期設定
        var left_leg = new Sprite(200,918)
        left_leg.image = core.assets['left_leg.png']
        left_leg.x = tail.x+89
        left_leg.y = tail.y-308
        core.rootScene.addChild(left_leg)
        
        //右手の初期設定
        var right_hand = new Sprite(300,740)
        right_hand.image = core.assets['right_hand.png']
        right_hand.x = tail.x-80
        right_hand.y = tail.y-483
        core.rootScene.addChild(right_hand)
        
        //右腕の初期設定
        var right_arm = new Sprite(300,740)
        right_arm.image = core.assets['right_arm.png']
        right_arm.x = tail.x-80
        right_arm.y = tail.y-483
        core.rootScene.addChild(right_arm)
        
        //左手の初期設定
        var left_hand = new Sprite(300,740)
        left_hand.image = core.assets['left_hand.png']
        left_hand.x = tail.x+50
        left_hand.y = tail.y-483
        core.rootScene.addChild(left_hand)
        
        //左腕の初期設定
        var left_arm = new Sprite(300,740)
        left_arm.image = core.assets['left_arm.png']
        left_arm.x = tail.x+50
        left_arm.y = tail.y-483
        core.rootScene.addChild(left_arm)
        
        //身体の初期設定
        var body = new Sprite(400,400)
        body.image = core.assets['body.png']
        body.x = tail.x-61
        body.y = tail.y-174
        core.rootScene.addChild(body)
        
        //眼の初期設定
        var eye = new Sprite(130,60)
        eye.image = core.assets['eye.png']
        eye.x = tail.x+68
        eye.y = tail.y-275
        core.rootScene.addChild(eye)
        
        //顔の初期設定
        var face = new Sprite(225,225)
        face.image = core.assets['face.png']
        face.x = tail.x+20
        face.y = tail.y-341
        face.frame = 3
        core.rootScene.addChild(face)
        
        //首の初期設定
        var fur = new Sprite(250,150)
        fur.image = core.assets['fur.png']
        fur.x = tail.x+3
        fur.y = tail.y-199
        core.rootScene.addChild(fur)
        
        //右羽の初期設定
        var right_wing = new Sprite(360,360)
        right_wing.image = core.assets['right_wing.png']
        right_wing.x = tail.x-103
        right_wing.y = tail.y-585
        core.rootScene.addChild(right_wing)
        
        //左羽の初期設定
        var left_wing = new Sprite(360,360)
        left_wing.image = core.assets['left_wing.png']
        left_wing.x = tail.x+17
        left_wing.y = tail.y-579
        core.rootScene.addChild(left_wing)
        
        //前髪の初期設定
        var bangs = new Sprite(263,165)
        bangs.image = core.assets['bangs.png']
        bangs.x = tail.x-2
        bangs.y = tail.y-431
        core.rootScene.addChild(bangs)
        
        //右もみ上げの初期設定
        var right_hair = new Sprite(266,914)
        right_hair.image = core.assets['right_hair.png']
        right_hair.x = tail.x-51
        right_hair.y = tail.y-880
        core.rootScene.addChild(right_hair)
        
        //左もみ上げ髪の初期設定
        var left_hair = new Sprite(216,932)
        left_hair.image = core.assets['left_hair.png']
        left_hair.x = tail.x+80
        left_hair.y = tail.y-886
        core.rootScene.addChild(left_hair)
        
        //バックベアードの初期設定
        var Back_Baird = new Sprite(173,129)
        Back_Baird.image = core.assets['Back_Baird.png']
        Back_Baird.x = 0
        Back_Baird.y = 5000
        core.rootScene.addChild(Back_Baird)
        
        var Ground1 = new Sprite(1200,200)
        Ground1.image = core.assets['Ground.png']
        Ground1.x = tail.x-467
        Ground1.y = 5000
        Ground1.frame = 0
        core.rootScene.addChild(Ground1)
        
        var label1 = new Label();
        label1.x = 0;
        label1.y = 0;
        label1.color = 'red';
        label1.font = '40px "Arial"';
        label1.on('enterframe', function(){
                 label1.text = ('スピード　= '+Math.ceil(spead_t));
                 });
        core.rootScene.addChild(label1)
        
        var label2 = new Label();
        label2.x = 0;
        label2.y = 40;
        label2.color = 'red';
        label2.font = '40px "Arial"';
        label2.on('enterframe', function(){
                 label2.text = ('距離　= ' +Math.round((1320-926-right_leg.y)));
                 });
        core.rootScene.addChild(label2)
        
        function warp(name){
                      if(name.x < 0-400){
                      name.x = 1400+400
                          tail.x = right_leg.x+13
                          back_hair.x = right_leg.x-47
                          left_leg.x = right_leg.x+102
                          right_hand.x = right_leg.x-67
                          right_arm.x = right_leg.x-67
                          left_hand.x = right_leg.x+63
                          left_arm.x = right_leg.x+63
                          body.x = right_leg.x-48
                          eye.x = right_leg.x+97
                          face.x = right_leg.x+33
                          fur.x = right_leg.x+16
                          right_wing.x = right_leg.x-90
                          left_wing.x = right_leg.x+30
                          bangs.x = right_leg.x+11
                          right_hair.x = right_leg.x-38
                          left_hair.x = right_leg.x+93
                      }
                        if(name.x > 1400+400){
                          name.x = 0-400
                            tail.x = right_leg.x+13
                            back_hair.x = right_leg.x-47
                            left_leg.x = right_leg.x+102
                            right_hand.x = right_leg.x-67
                            right_arm.x = right_leg.x-67
                            left_hand.x = right_leg.x+63
                            left_arm.x = right_leg.x+63
                            body.x = right_leg.x-48
                            eye.x = right_leg.x+97
                            face.x = right_leg.x+33
                            fur.x = right_leg.x+16
                            right_wing.x = right_leg.x-90
                            left_wing.x = right_leg.x+30
                            bangs.x = right_leg.x+11
                            right_hair.x = right_leg.x-38
                            left_hair.x = right_leg.x+93
                      }
                      }
        
        function idou(name){
            if (core.input.down){
                name.y+=5
            }
            if (core.input.up){
                name.y-=5
                if(face1 % 3 == 1){
                }
            }
            if (core.input.left){
                name.x-=5
            }
            if (core.input.right){
                name.x+=5
            }
        }
        
        function grand(name){
            name.y-=spead_t
            if(face1 % 3 == 1){
            if (core.input.right){
                name.x+=10
                if(1320-926-right_leg.y==0){
                    right_leg.rotation=-time*0.8
                    left_leg.rotation=time*0.8
                    right_hand.rotation=-time*0.2
                    left_hand.rotation=time*0.2
                    right_arm.rotation=-time*0.1
                    left_arm.rotation=time*0.1
                }
            }
            if (core.input.left){
                name.x-=10
                if(1320-926-right_leg.y==0){
                    right_leg.rotation=-time*0.8
                    left_leg.rotation=time*0.8
                    right_hand.rotation=-time*0.2
                    left_hand.rotation=time*0.2
                    right_arm.rotation=-time*0.1
                    left_arm.rotation=time*0.1
                }
            }
            }
        }
        
        function grand1(name){
          name.y += (1320-926-right_leg.y)
          spead_t = 0
        }
        
        right_leg.addEventListener('enterframe',function(){
                              if(time>30){
                              iii*=-1
                              }
                              if(time<-30){
                              iii*=-1
                              }
                              time+=1*iii
                              ggg+=0.1
                              e = 0.3
                                   if(face1 % 3 == 1){
                                   if(1320-926-right_leg.y>0){
                                   right_wing.rotation=time*0.4
                                   left_wing.rotation=-time*0.4
                                   right_hand.rotation=(time+20)*0.68
                                   left_hand.rotation=-(time+20)*0.68
                                   right_arm.rotation=(time+30)*0.52
                                   left_arm.rotation=-(time+30)*0.52
                                   right_leg.rotation=(time+30)*0.52
                                   left_leg.rotation=-(time+30)*0.52
                                   }
                              else{
                              right_wing.rotation=time*0.1
                              left_wing.rotation=-time*0.1
                              right_hair.rotation=(time+30)*0.015
                              left_hair.rotation=-(time+30)*0.015
                              right_leg.rotation=0
                              left_leg.rotation=0
                              right_hand.rotation=(time+20)*0.08
                              left_hand.rotation=-(time+20)*0.08
                              right_arm.rotation=(time+30)*0.02
                              left_arm.rotation=-(time+30)*0.02
                              face.y += time*0.015
                              eye.y += time*0.015
                              right_wing.y += time*0.015
                              left_wing.y += time*0.015
                              right_hair.y += time*0.015
                              left_hair.y += time*0.015
                              bangs.y += time*0.015
                              back_hair.y += time*0.015
                              back_hair.rotation =-(time+15)*0.05
                              bangs.rotation =(time+30)*0.03
                              body.y += time*0.008
                              left_hand.y += time*0.008
                              right_hand.y += time*0.008
                              left_arm.y += time*0.008
                              right_arm.y += time*0.008
                              fur.y += time*0.015
                              tail.y += time*0.015
                              }
                              }
                                   else{
                                   right_wing.rotation=time*0.1
                                   left_wing.rotation=-time*0.1
                                   right_hair.rotation=(time+30)*0.015
                                   left_hair.rotation=-(time+30)*0.015
                                   right_leg.rotation=0
                                   left_leg.rotation=0
                                   right_hand.rotation=(time+20)*0.08
                                   left_hand.rotation=-(time+20)*0.08
                                   right_arm.rotation=(time+30)*0.02
                                   left_arm.rotation=-(time+30)*0.02
                                   face.y += time*0.015
                                   eye.y += time*0.015
                                   right_wing.y += time*0.015
                                   left_wing.y += time*0.015
                                   right_hair.y += time*0.015
                                   left_hair.y += time*0.015
                                   bangs.y += time*0.015
                                   back_hair.y += time*0.015
                                   back_hair.rotation =-(time+15)*0.05
                                   bangs.rotation =(time+30)*0.03
                                   body.y += time*0.008
                                   left_hand.y += time*0.008
                                   right_hand.y += time*0.008
                                   left_arm.y += time*0.008
                                   right_arm.y += time*0.008
                                   fur.y += time*0.015
                                   tail.y += time*0.015
                                   }
                                   eye.x = tail.x+68
                                   eye.y = tail.y-275
                                   if(face1 % 3 == 0){
                                   Back_Baird.rotation=time
                                   Back_Baird.y -= spead
                                   }
                              spead = syosoku-gra*ggg
                              idou(eye)
                              grand(eye)
                              grand(back_hair)
                              grand(tail)
                              grand(bangs)
                              grand(left_hand)
                              grand(right_hand)
                              grand(left_arm)
                              grand(right_arm)
                              grand(left_leg)
                              grand(left_wing)
                              grand(right_wing)
                              grand(body)
                              grand(fur)
                              grand(face)
                              grand(right_hair)
                              grand(left_hair)
                              grand(right_leg)
                                   if(face1 % 3 == 0){
                                   eye.x=Back_Baird.x
                                   eye.y=Back_Baird.y
                                   idou(Ground1)
                                   if(Back_Baird.y-right_leg.y<463 && Back_Baird.y-right_leg.y>-463+280 && Back_Baird.x-right_leg.x<-530){
                                   right_arm.rotation=0-(Back_Baird.y-right_leg.y-463)/5;
                                   right_hand.rotation=0-(Back_Baird.y-right_leg.y-463)/5;
                                   }
                                   else if(Back_Baird.y-right_leg.y<463 && Back_Baird.y-right_leg.y>-463+280 && Back_Baird.x-right_leg.x>650){
                                   left_arm.rotation=0+(Back_Baird.y-right_leg.y-463)/5;
                                   left_hand.rotation=0+(Back_Baird.y-right_leg.y-463)/5;
                                   }
                                   else if(Back_Baird.y-right_leg.y<-463+280 && Back_Baird.x-right_leg.x<-530){
                                   right_arm.rotation=130;
                                   right_hand.rotation=130;
                                   }
                                   else if(Back_Baird.y-right_leg.y<-463+280 && Back_Baird.x-right_leg.x>650){
                                   left_arm.rotation=-130;
                                   left_hand.rotation=-130;
                                   }
                                   }
                                   if(face1 % 3 == 2){
                                   eye.x=Back_Baird.x
                                   eye.y=Back_Baird.y
                                   idou(Ground1)
                                   if(Back_Baird.y-right_leg.y<463 && Back_Baird.y-right_leg.y>-463+280 && Back_Baird.x-right_leg.x<-530){
                                   right_arm.rotation=0-(Back_Baird.y-right_leg.y-463)/5;
                                   right_hand.rotation=0-(Back_Baird.y-right_leg.y-463)/5;
                                   }
                                   else if(Back_Baird.y-right_leg.y<463 && Back_Baird.y-right_leg.y>-463+280 && Back_Baird.x-right_leg.x>650){
                                   left_arm.rotation=0+(Back_Baird.y-right_leg.y-463)/5;
                                   left_hand.rotation=0+(Back_Baird.y-right_leg.y-463)/5;
                                   }
                                   else if(Back_Baird.y-right_leg.y<-463+280 && Back_Baird.x-right_leg.x<-530){
                                   right_arm.rotation=130;
                                   right_hand.rotation=130;
                                   }
                                   else if(Back_Baird.y-right_leg.y<-463+280 && Back_Baird.x-right_leg.x>650){
                                   left_arm.rotation=-130;
                                   left_hand.rotation=-130;
                                   }
                                   }
                              if(eye.x>face.x+64){
                              eye.x=face.x+64
                              }
                              if(eye.x<face.x+32){
                              eye.x=face.x+32
                              }
                              if(eye.y>face.y+90){
                              eye.y=face.y+90
                              }
                              if(eye.y<face.y+50){
                              eye.y=face.y+50
                              }
                              })
        
        right_leg.addEventListener('enterframe',function(){
                                   
                                   if(face1 % 3 == 1){
                                   warp(right_leg)
                                   if(this.y>1320-926){
                                   grand1(eye)
                                   grand1(back_hair)
                                   grand1(tail)
                                   grand1(bangs)
                                   grand1(left_hand)
                                   grand1(right_hand)
                                   grand1(left_arm)
                                   grand1(right_arm)
                                   grand1(left_leg)
                                   grand1(left_wing)
                                   grand1(right_wing)
                                   grand1(body)
                                   grand1(fur)
                                   grand1(face)
                                   grand1(right_hair)
                                   grand1(left_hair)
                                   grand1(right_leg)
                                   }
                                   
                                   if(core.input.up){
                                   ggg_t=0
                                   
                                   if(spead_t<11){
                                   spead_t+=0.1
                                   syosoku_t=spead_t
                                   }
                                   }
                                   else{
                                   if(this.y<1320-926){
                                   ggg_t+=0.01
                                   spead_t = syosoku_t-gra*ggg_t
                                   }
                                   else {
                                   ggg_t = 0
                                   syosoku_t = -spead_t*0
                                   spead_t = 0
                                   }
                                   }
                                   }
                                   else{
                                   idou(eye)
                                   idou(back_hair)
                                   idou(tail)
                                   idou(bangs)
                                   idou(left_hand)
                                   idou(right_hand)
                                   idou(left_arm)
                                   idou(right_arm)
                                   idou(left_leg)
                                   idou(left_wing)
                                   idou(right_wing)
                                   idou(body)
                                   idou(fur)
                                   idou(face)
                                   idou(right_hair)
                                   idou(left_hair)
                                   idou(right_leg)
                                   }
        })
        
        Ground1.addEventListener('enterframe',function(){
                                if(Ground1.intersect(Back_Baird)){
                                if(Back_Baird.y > Ground1.y-129){
                                if(Back_Baird.y < Ground1.y+50-129){
                                ggg = 0
                                syosoku = -spead*e
                                 if (core.input.up){
                                 syosoku += 25
                                 }
                                spead = 0
                                Back_Baird.y = Ground1.y-129
                                }
                                }
                                if(Back_Baird.y < Ground1.y+200){
                                if(Back_Baird.y > Ground1.y-50+200){
                                Back_Baird.y = Ground1.y+200
                                }
                                }
                                if(Back_Baird.x > Ground1.x-173){
                                if(Back_Baird.x < Ground1.x+50-173){
                                Back_Baird.x = Ground1.x-173
                                }
                                }
                                if(Back_Baird.x < Ground1.x+1200){
                                if(Back_Baird.x > Ground1.x-50+1200){
                                Back_Baird.x = Ground1.x+1200
                                }
                                 }
                                 }
                            
                                })//地面1
        
        core.rootScene.on('touchstart',function(e){
                          eee+=1
                          face1+=1
                          face.frame=face1
                          spead=0
                          syosoku=0
                          ggg=0
                          if(face1 % 3 == 1){
                          Back_Baird.y=5000
                          Ground1.y=5000
                          Blue_back.y=100
                          }
                          else if(face1 % 3 == 2){
                          syosoku_t=0
                          spead_t=0
                          Back_Baird.x=e.x
                          Back_Baird.y=e.y
                          Ground1.y = right_leg.y+926
                          Ground1.x = right_leg.x-450
                          Blue_back.y = 5000
                          }
                          })
        
    }
    core.start()
}
