const fs=require('fs');
const assert=require('assert');
const app=require('./script.js');
const html=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('script.js','utf8');
const admin=fs.readFileSync('admin.js','utf8');
const sql=fs.readFileSync('supabase_patch_dine_in_service_fee.sql','utf8');
const tests=[];function t(name,fn){try{fn();tests.push([name,true])}catch(e){tests.push([name,false,e.message])}}
t('dine-in 10%',()=>assert.equal(app.calculateServiceFee('В заведении',10000),1000));
t('delivery no service fee',()=>assert.equal(app.calculateServiceFee('Доставка',10000),0));
t('round to whole tenge',()=>assert.equal(app.calculateServiceFee('В заведении',8505),851));
t('checkout service line',()=>assert(html.includes('Обслуживание 10%')&&html.includes('checkout-service-fee')));
t('Kaspi duplicate removed',()=>assert(html.includes('<div id="kaspi-payment"><p>Введите итоговую сумму заказа вручную.</p></div>')));
t('recovery modal exists',()=>assert(html.includes('id="recovery-modal"')&&html.includes('Сохранить пароль')));
t('recovery updates Supabase user',()=>assert(js.includes('/auth/v1/user')&&js.includes('type\")==="recovery"')));
t('SQL stores service fee',()=>assert(sql.includes('service_fee integer')&&sql.includes('round(v_subtotal::numeric * 0.10)')));
t('SQL total includes service fee',()=>assert(sql.includes('v_subtotal::bigint + v_delivery_fee::bigint + v_service_fee::bigint')));
t('admin shows service fee',()=>assert(admin.includes('Обслуживание 10%')&&admin.includes('serviceFee')));
const failed=tests.filter(x=>!x[1]);console.log(JSON.stringify({passed:tests.length-failed.length,failed:failed.length,results:tests},null,2));if(failed.length)process.exit(1);
