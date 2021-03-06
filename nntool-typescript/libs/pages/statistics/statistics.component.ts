/*******************************************************************************
 * Copyright 2019 alladin-IT GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/

import { Component, OnInit, ViewChild } from '@angular/core';
import { SpringServerDataSource } from '../../core/services/table/spring-server.data-source';
import { NGXLogger } from 'ngx-logger';
import { StatisticApiService } from '../../core/services/statistic-api.service';
import { ProviderFilterResponseWrapper, ProviderFilterResponse } from '../../core/models/provider-filter-response';
import { DynamicFormComponent, FormValue } from '../../core/components/dynamic-form/dynamic-form.component';

@Component({
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.less']
})
export class StatisticsComponent implements OnInit {
  public settings = {
    //hideSubHeader: false,
    columns: {
      provider_name: {
        title: 'Provider',
        filter: true
      },
      provider_asn: {
        title: 'ASN',
        filter: true
      },
      mcc_mnc: {
        title: 'MCC-MNC',
        filter: true
      },
      country_code: {
        title: 'Country',
        filter: true
      },
      download_bps: {
        title: 'Download',
        filter: false,
        valuePrepareFunction: (cell, row) => {
          if (row.download_bps) {
            return (row.download_bps / 1000_000).toFixed(2);
          } else {
            return 'n/a';
          }
        }
      },
      upload_bps: {
        title: 'Upload',
        filter: false,
        valuePrepareFunction: (cell, row) => {
          if (row.upload_bps) {
            return (row.upload_bps / 1000_000).toFixed(2);
          } else {
            return 'n/a';
          }
        }
      },
      rtt_ns: {
        title: 'RTT',
        filter: false,
        valuePrepareFunction: (cell, row) => {
          if (row.rtt_ns) {
            return (row.rtt_ns / 1000_000).toFixed(2);
          } else {
            return 'n/a';
          }
        }
      },
      signal_strength_dbm: {
        title: 'Signal',
        filter: false
      },
      count: {
        title: 'Count',
        filter: false
      }
    }
  };

  public tableSource: SpringServerDataSource;

  constructor(private logger: NGXLogger, private statisticApiService: StatisticApiService) {
    this.tableSource = this.statisticApiService.getProviderStatisticsServerDataSource();
  }

  public filterResponse: ProviderFilterResponse;

  @ViewChild(DynamicFormComponent, { static: true }) public dynamo: DynamicFormComponent;

  public ngOnInit(): void {
    this.statisticApiService.getProviderFilterConfiguration().subscribe(
      (dataWrapper: ProviderFilterResponseWrapper) => {
        this.filterResponse = dataWrapper.data;
      },
      (error: string) => {
        this.logger.error(error);
      }
    );
  }

  onFormChangeCallback($event: FormValue[]) {
    if (this.tableSource && $event) {
      $event.forEach(val => {
        this.tableSource.setHttpParam(val.key, val.value);
      });
      this.tableSource.refresh();
    }
  }
}
