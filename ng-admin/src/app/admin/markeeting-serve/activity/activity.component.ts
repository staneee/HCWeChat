import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { Activity } from '@shared/service-proxies/entity/acitivity';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { ActivityGoodsServiceProxy, PagedResultDtoOfActivityGoods } from '@shared/service-proxies/marketing-service/activity-goods-service';
import { Parameter } from '@shared/service-proxies/entity';
import { ActivityServiceProxy } from '@shared/service-proxies/marketing-service/acticity-service';
import { NzModalService } from 'ng-zorro-antd';
import { ActivityGoods } from '@shared/service-proxies/entity/activity-goods';

@Component({
    moduleId: module.id,
    selector: 'activity',
    templateUrl: 'activity.component.html',
})
export class ActivityComponent extends AppComponentBase implements OnInit {

    acitivityDto: Activity = new Activity;
    goodes: ActivityGoods[] = [];
    good: ActivityGoods = new ActivityGoods;
    html = '';
    formA: FormGroup;
    searchName = '';
    loading = false;
    AcTypes = [
        { text: '办事用烟', value: 1 }
    ];
    publishTimes: string;
    activityId = '';
    //按钮是否可见
    isSave = true;
    isPulish = false;
    isGoodabled = false;
    isConfirmLoading = false;
    isAlert = false;
    //行内编辑
    editIndex = -1;
    editObj = {};

    constructor(injector: Injector, private activityService: ActivityServiceProxy,
        private fb: FormBuilder, private activityGoodsService: ActivityGoodsServiceProxy,
        private modal: NzModalService,
    ) {
        super(injector);
    }

    /**
     * 页面初始加载
     */
    ngOnInit(): void {
        this.formA = this.fb.group({
            name: [null, Validators.compose([Validators.required, Validators.maxLength(200)])],
            beginTime: [null, Validators.compose([Validators.required])],
            endTime: [null, [Validators.required]],
            activityType: [null, Validators.compose([Validators.required])],
            mUnfinished: [null],
            rUnfinished: [null],
            content: [null, Validators.compose([Validators.required])],
            status: [null],
            publishTime: [null],
            items: this.fb.array([])
        });
        this.getSingleActivity();
    }


    //#region 活动

    /**
     * 
     * @param name 
     */
    getFormControl(name: string) {
        return this.formA.controls[name];
    }
    /**
     * 获取单个活动信息
     */
    getSingleActivity() {
        this.activityService.get().subscribe((result: Activity) => {
            this.acitivityDto = result;
            this.publishTimes = this.dateFormat(this.acitivityDto.publishTime);
            this.activityId = result.id;
            if (this.acitivityDto.id) {
                this.isGoodabled=true;
                this.isSave = false;
                this.isPulish = true;
            } else {
                //活动活动状态
                this.acitivityDto.status = 1;
                //按钮是否可见
                this.isSave = true;
                this.isPulish = false;
                this.acitivityDto.mUnfinished = 15;
                this.acitivityDto.rUnfinished = 6;
            }
            this.refreshData();
        });
    }
    /**
     * 保存活动
     */
    saveSub() {
        for (const i in this.formA.controls) {
            this.formA.controls[i].markAsDirty();
        }
        if (this.formA.valid) {
            this.isConfirmLoading = true;
            if (!this.acitivityDto.id) {
                //当新增活动时将活动状态设为草稿
                this.acitivityDto.status = 1;
            }
            this.saveActivity();

        }
    }
    /**
     * 活动保存
     */
    saveActivity() {
        this.activityService.update(this.acitivityDto)
            .finally(() => { this.isConfirmLoading = false; })
            .subscribe(() => {
                this.notify.info(this.l('保存成功！'));
            });
    }

    //#endregion

    //#region 活动商品

    get items() { return this.formA.controls.items as FormArray; }
    /**
     * 获取活动商品信息
     */
    refreshData() {
        this.loading = true;
        this.activityGoodsService.getAll(this.query.skipCount(), this.query.pageSize, this.getParameter()).subscribe((result: PagedResultDtoOfActivityGoods) => {
            this.goodes = result.items;
            this.loading = false;
            this.query.total = result.totalCount;
            this.goodes.forEach(i => {
                //创建formbuilder
                const field = this.createFormGoods();
                //给formbuilder赋值
                field.patchValue(i);
                //将有值得formbuilder付给items
                this.items.push(field);
            });
        });
    }

    createFormGoods(): FormGroup {
        return this.fb.group({
            specification: [null, Validators.compose([Validators.required, Validators.maxLength(200)])],
            minNum: [null, Validators.compose([Validators.required, Validators.min(0)])],
            maxNum: [null, [Validators.compose([Validators.required, Validators.min(0)])]],
            discountDesc: [null],
            id: [null],
        })
    }

    getParameter(): Parameter[] {
        let arry = [];
        arry.push(Parameter.fromJS({ key: 'AvtivityId', value: this.acitivityDto.id == '0' ? '' : this.acitivityDto.id }));
        arry.push(Parameter.fromJS({ key: 'SearchName', value: this.searchName }));
        return arry;
    }

    /**
     * 新增
     * @param i 
     */
    add() {
        this.items.push(this.createFormGoods());
        var index = this.items.length - 1
        this.edit(index);
        // this.items.at(index).value.minNum = 10;
    }

    /**
     * 编辑
     * @param i 
     */
    edit(index: number) {
        //editIndex用于判断是否新增
        if (this.editIndex !== -1 && this.editObj) {
            this.items.at(this.editIndex).patchValue(this.editObj);
        }
        //editObj用于当编辑取消时将它付给编辑的行
        this.editObj = { ...this.items.at(index).value };
        this.editIndex = index;
    }

    /**
     * 保存
     * @param index 
     */
    save(index: number) {
        this.items.at(index).markAsDirty();
        if (this.items.at(index).invalid) return;
        this.editIndex = -1;
        //保存入数据库
        this.itemToGood(index);
        this.activityGoodsService.update(this.good).subscribe((result: ActivityGoods) => {
            //将新增的实体添加到实体集合中
            this.goodes.push(result)
            //将新增的实体加入到form中（主要是添加id）
            this.items.at(index).patchValue(result);
            this.notify.info(this.l('保存成功！'));
            this.good = new ActivityGoods();
        });
    }
    /**
     * 删除
     * @param i 
     */
    delete(index: number, id?: number) {
        if (id) {
            this.activityGoodsService.delete(this.items.at(index).value.id).subscribe(() => {
                this.notify.info(this.l('删除成功！'));
                this.items.removeAt(index);
            });
        } else {
            this.items.removeAt(index);
        }
    }

    /**
     * 取消
     * @param i 
     */
    cancel(index: number) {
        //当id为空的时候就删除新建的一行（新建取消）
        //当id不为空的时候就把原来的值付给当前行（编辑取消）
        if (!this.items.at(index).value.id) {
            this.delete(index);
        } else {
            this.items.at(index).patchValue(this.editObj);
        }
        this.editIndex = -1;
    }
    //#endregion

    /**
     * 发布(增加下架验证)
     */
    pulish(contentTpl) {
        if (this.goodes.length > 0) {
            this.acitivityDto.status = 2;
            this.acitivityDto.publishTime = new Date;
            this.saveSub();
        } else {
            this.modal.warning({
                title: '请先添加商品！'
            });
        }
    }

    /**
     * 将页面的数据转换到good中
     * @param index 
     */
    itemToGood(index: number) {
        this.good = new ActivityGoods();
        this.good.activityId = this.acitivityDto.id;
        if (this.items.at(index).value.id) {
            this.goodes.forEach(i => {
                if (i.id == this.items.at(index).value.id) {
                    this.good = i;
                }
            });
        }
        //将form中输入的数据放入实体中
        this.good.specification = this.items.at(index).value.specification;
        this.good.minNum = this.items.at(index).value.minNum;
        this.good.maxNum = this.items.at(index).value.maxNum;
        this.good.discountDesc = this.items.at(index).value.discountDesc;
    }
}