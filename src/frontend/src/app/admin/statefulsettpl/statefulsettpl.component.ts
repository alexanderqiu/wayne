import {Component, OnInit, ViewChild} from '@angular/core';
import {BreadcrumbService} from '../../shared/client/v1/breadcrumb.service';
import {ActivatedRoute} from '@angular/router';
import {State} from '@clr/angular';
import {ConfirmationDialogService} from '../../shared/confirmation-dialog/confirmation-dialog.service';
import {ConfirmationMessage} from '../../shared/confirmation-dialog/confirmation-message';
import {ConfirmationButtons, ConfirmationState, ConfirmationTargets} from '../../shared/shared.const';
import {Subscription} from 'rxjs/Subscription';
import {MessageHandlerService} from '../../shared/message-handler/message-handler.service';
import {PageState} from '../../shared/page/page-state';
import {ListStatefulsettplComponent} from './list-statefulsettpl/list-statefulsettpl.component';
import {CreateEditStatefulsettplComponent} from './create-edit-statefulsettpl/create-edit-statefulsettpl.component';
import {StatefulsetTplService} from '../../shared/client/v1/statefulsettpl.service';
import {StatefulsetTemplate} from '../../shared/model/v1/statefulsettpl';

@Component({
  selector: 'wayne-statefulsettpl',
  templateUrl: './statefulsettpl.component.html',
  styleUrls: ['./statefulsettpl.component.scss']
})
export class StatefulsettplComponent implements OnInit {

  @ViewChild(ListStatefulsettplComponent)
  listStatefulset: ListStatefulsettplComponent;
  @ViewChild(CreateEditStatefulsettplComponent)
  createEditStatefulset: CreateEditStatefulsettplComponent;
  pageState: PageState = new PageState({pageSize: 10});
  statefulsetId: number;
  changedStatefulsets: StatefulsetTemplate[];

  subscription: Subscription;

  constructor(
    private breadcrumbService: BreadcrumbService,
    private statefulsetTplService: StatefulsetTplService,
    private route: ActivatedRoute,
    private messageHandlerService: MessageHandlerService,
    private deletionDialogService: ConfirmationDialogService) {
    breadcrumbService.addFriendlyNameForRoute('/admin/statefulset/tpl', '状态副本集模板列表');
    breadcrumbService.addFriendlyNameForRoute('/admin/statefulset/tpl/trash', '已删除状态副本集模板列表');
    this.subscription = deletionDialogService.confirmationConfirm$.subscribe(message => {
      if (message &&
        message.state === ConfirmationState.CONFIRMED &&
        message.source === ConfirmationTargets.STATEFULSET_TPL) {
        let id = message.data;
        this.statefulsetTplService.deleteById(id, 0)
          .subscribe(
            response => {
              this.messageHandlerService.showSuccess('状态副本集模版删除成功！');
              this.retrieve();
            },
            error => {
              this.messageHandlerService.handleError(error);
            }
          );
      }
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.statefulsetId = params['did'];
      if (typeof(this.statefulsetId) == 'undefined') {
          this.statefulsetId = 0
      }
    })
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  retrieve(state?: State): void {
    if (state) {
      this.pageState = PageState.fromState(state, {pageSize: 10, totalPage: this.pageState.page.totalPage, totalCount: this.pageState.page.totalCount});
    }
    this.pageState.params['deleted'] = false;
    this.statefulsetTplService.listPage(this.pageState, this.statefulsetId)
      .subscribe(
        response => {
          let data = response.data;
          this.pageState.page.totalPage = data.totalPage;
          this.pageState.page.totalCount = data.totalCount;
          this.changedStatefulsets = data.list;
        },
        error => this.messageHandlerService.handleError(error)
      );
  }

  createStatefulset(created: boolean) {
    if (created) {
      this.retrieve()
    }
  }

  openModal(): void {
    this.createEditStatefulset.newOrEdit();
  }

  deleteStatefulset(tpl: StatefulsetTemplate) {
    let deletionMessage = new ConfirmationMessage(
      '删除状态副本集模版确认',
      '你确认删除状态副本集模版 ' + tpl.name + ' ？',
      tpl.id,
      ConfirmationTargets.STATEFULSET_TPL,
      ConfirmationButtons.DELETE_CANCEL
    );
    this.deletionDialogService.openComfirmDialog(deletionMessage);
  }

  editStatefulset(tpl: StatefulsetTemplate) {
    this.createEditStatefulset.newOrEdit(tpl.id);
  }

}
