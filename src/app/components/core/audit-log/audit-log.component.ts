import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subject, Subscription } from 'rxjs';
import { takeWhile, takeUntil } from 'rxjs/operators';
import { AlertService, AuditService, PingService, ProgressBarService } from '../../../services';
import { MAX_INT_SIZE, POLLING_INTERVAL } from '../../../utils';

@Component({
  selector: 'app-audit-log',
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.css']
})
export class AuditLogComponent implements OnInit, OnDestroy {
  public logSourceList = [];
  public logSeverityList = [];
  public audit = [];
  public totalCount: any;
  public DEFAULT_LIMIT = 20;
  public MAX_RANGE = MAX_INT_SIZE;
  limit = this.DEFAULT_LIMIT;
  public source = '';
  public severity = '';
  public isAlive: boolean;

  page = 1;             // Default page is 1 in pagination
  recordCount = 0;
  tempOffset = 0;
  totalPagesCount = 0;
  isInvalidLimit = false;

  public refreshInterval = POLLING_INTERVAL;
  destroy$: Subject<boolean> = new Subject<boolean>();
  private subscription: Subscription;

  constructor(private auditService: AuditService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    private ping: PingService) {
    this.isAlive = true;
    this.ping.pingIntervalChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((timeInterval: number) => {
        if (timeInterval === -1) {
          this.isAlive = false;
        }
        this.refreshInterval = timeInterval;
      });
  }

  ngOnInit() {
    this.getLogSource();
    this.getLogSeverity();
    this.subscription =  interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.getAuditLogs(true);
      });
  }

  /**
   *  Go to the page on which user clicked in pagination
   */
  goToPage(n: number): void {
    this.page = n;
    this.setLimitOffset();
  }

  /**
   *  Go to the next page
   */
  onNext(): void {
    this.page++;
    this.setLimitOffset();
  }

  /**
   *  Go to the first page
   */
  onFirst(): void {
    this.page = 1;
    this.setLimitOffset();
  }

  /**
  *  Calculate number of pages for pagination based on total records;
  */
  public totalPages() {
    this.totalPagesCount = Math.ceil(this.recordCount / this.limit) || 0;
  }

  /**
   *  Go to the last page
   */
  onLast(): void {
    const p = Math.ceil(this.recordCount / this.limit) || 0;
    this.page = p;
    this.setLimitOffset();
  }

  /**
   *  Go to the previous page
   */
  onPrev(): void {
    this.page--;
    this.setLimitOffset();
  }

  public toggleDropDown(id: string) {
    const activeDropDowns = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDowns.length > 0) {
      if (activeDropDowns[0].id !== id) {
        activeDropDowns[0].classList.remove('is-active');
      }
    }
    const dropDown = document.querySelector(`#${id}`);
    dropDown.classList.toggle('is-active');
  }

  /**
   *  Set limit and offset (it is internally called by goToPage(), onNext(), onPrev(), onFirst(), onLast() methods)
   */
  setLimitOffset() {
    if (this.limit === 0) {
      this.limit = this.DEFAULT_LIMIT;
    }
    this.tempOffset = (((this.page) - 1) * this.limit);
    this.getAuditLogs();
  }

  resetLimitPerPage(value) {
    this.setLimit(value);
  }

  public getLogSource() {
    this.auditService.getLogSource().
      subscribe(
        (data: any) => {
          this.logSourceList = data.logCode.filter((log: any) => !(/NTF/.test(log.code)));
          this.getAuditLogs();
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public getLogSeverity() {
    this.auditService.getLogSeverity().
      subscribe(
        (data) => {
          this.logSeverityList = data['logSeverity'];
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public setLimit(limit) {
    this.isInvalidLimit = false;
    if (+limit > this.MAX_RANGE) {
      this.isInvalidLimit = true; // limit range validation
      return;
    }
    if (this.page !== 1) {
      this.page = 1;
    }
    if (limit === '' || limit === 0 || limit === null || limit === undefined) {
      limit = this.DEFAULT_LIMIT;
    }
    this.limit = limit;
    console.log('Limit: ', this.limit);
    this.totalPages();
    this.getAuditLogs();
  }

  public getAuditLogs(autoRefresh = false): void {
    if (this.limit == null) {
      this.limit = 0;
    }
    this.auditLogSubscriber(autoRefresh);
  }

  public filterSource(type: string, code: string) {
    this.limit = this.DEFAULT_LIMIT;
    this.tempOffset = 0;
    this.recordCount = 0;
    if (this.page !== 1) {
      this.page = 1;
    }

    if (type === 'source') {
      this.source = code.trim().toLowerCase() === 'source' ? '' : code.trim().toLowerCase();
    }
    if (type === 'severity') {
      this.severity = code.trim().toLowerCase() === 'severity' ? '' : code.trim().toLowerCase();
    }
    this.auditLogSubscriber();
  }

  auditLogSubscriber(autoRefresh = false) {
    let sourceCode = this.source;
    if (this.source.length === 0) {
      const codes = this.logSourceList.map(s => s.code);
      sourceCode = codes.toString();
    }
    if (autoRefresh === false) {
      this.ngProgress.start();
    }
    this.auditService.getAuditLogs(this.limit, this.tempOffset, sourceCode, this.severity)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          if (autoRefresh === false) {
            this.ngProgress.done();
          }
          this.audit = data.audit.filter((log: any) => !(/NTF/.test(log.source)));
          this.totalCount = data.totalCount;
          this.recordCount = this.totalCount;
          this.totalPages();
        },
        error => {
          if (autoRefresh === false) {
            this.ngProgress.done();
          }
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  toggleAutoRefresh(event: any) {
    this.isAlive = event.target.checked;
    // clear interval subscription before initializing it again
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    /**
     * Set refresh interval to default if Auto Refresh checked and
     * pingInterval is set to manual on settings page
     * */
    if (this.isAlive && this.refreshInterval === -1) {
      this.refreshInterval = POLLING_INTERVAL;
    }

    this.subscription =  interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.getAuditLogs(true);
      });

  }

  public ngOnDestroy(): void {
    this.isAlive = false;
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    this.subscription.unsubscribe();
  }
}
