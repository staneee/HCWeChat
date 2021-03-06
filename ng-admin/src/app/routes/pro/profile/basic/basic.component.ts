import { Component } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd';
import { _HttpClient } from '@delon/theme';
import { SimpleTableColumn } from '@delon/abc';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'pro-profile-basic',
    templateUrl: './basic.component.html'
})
export class ProProfileBaseComponent {

    basicNum = 0;
    amountNum = 0;
    goods = this.http.get('/profile/goods').pipe(
        tap(list => {
            list.forEach(item => {
                this.basicNum += Number(item.num);
                this.amountNum += Number(item.amount);
            });
        })
    );
    goodsColumns: SimpleTableColumn[] = [
        { title: '商品编号', index: 'id' },
        { title: '商品名称', index: 'name' },
        { title: '商品条码', index: 'barcode' },
        { title: '单价', index: 'price', type: 'currency' },
        { title: '数量（件）', index: 'num', className: 'text-right' },
        { title: '金额', index: 'amount', type: 'currency' }
    ];
    progress = this.http.get('/profile/progress');
    progressColumns: SimpleTableColumn[] = [
        { title: '时间', index: 'time' },
        { title: '当前进度', index: 'rate' },
        { title: '状态', render: 'status' },
        { title: '操作员ID', index: 'operator' },
        { title: '耗时', index: 'cost' }
    ];

    constructor(private http: _HttpClient) {}
}
