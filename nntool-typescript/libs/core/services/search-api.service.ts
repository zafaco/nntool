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

import { Location } from '@angular/common';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { RequestsService } from './requests.service';
import { SpringServerDataSource } from './table/spring-server.data-source';
import { SpringServerSourceConf } from './table/spring-server-source.conf';
import { WebsiteSettings } from '../models/settings/settings.interface';

@Injectable()
export class SearchApiService {
  private config: WebsiteSettings;

  constructor(
    private logger: NGXLogger,
    private requests: RequestsService,
    private configService: ConfigService,
    private http: HttpClient
  ) {
    this.config = this.configService.getConfig();
  }

  getServerDataSource(): SpringServerDataSource {
    return new SpringServerDataSource(
      this.http,
      new SpringServerSourceConf({
        endPoint: this.config.servers.search + 'measurements',
        mapFunction: (dto: any) => dto //this.groupMapper.dtoToModel(dto)
      })
    );
  }

  public exportOpenDataMeasurementsByDate(date: Date, extension: string) {
    window.open(
      Location.joinWithSlash(
        this.config.servers.search,
        'measurements/' + date.getFullYear() + '/' + (date.getMonth() + 1) + '.' + extension
      )
    );
  }

  public exportOpenDataMeasurements(q: string, pageSize: number, page: number, extension: string) {
    let queryString = '?size=' + pageSize + '&page=' + page;

    if (q) {
      queryString += '&q=' + q;
    }

    //window.open(Location.joinWithSlash(this.config.servers.search, 'measurements.' + extension + queryString)); // this opens a new window in Electron...
    window.location.href = Location.joinWithSlash(
      this.config.servers.search,
      'measurements.' + extension + queryString
    );
  }

  public getSingleOpenDataMeasurement(openDataUuid: string): Observable<any> {
    return new Observable((observer: any) => {
      this.requests
        .getJson<any>(Location.joinWithSlash(this.config.servers.search, 'measurements/' + openDataUuid), {})
        .subscribe(
          (data: any) => {
            this.logger.debug('opendata measurement: ', data);

            observer.next(data);
          },
          (error: HttpErrorResponse) => {
            this.logger.error('Error retrieving single open-data measurement', error);
            observer.error();
          },
          () => observer.complete()
        );
    });
  }

  public getSingleGroupedOpenDataMeasurement(openDataUuid: string): Observable<any> {
    return new Observable((observer: any) => {
      this.requests
        .getJson<any>(
          Location.joinWithSlash(this.config.servers.search, 'measurements/' + openDataUuid + '/details'),
          {}
        )
        .subscribe(
          (data: any) => {
            this.logger.debug('grouped opendata measurement: ', data);

            observer.next(data);
          },
          (error: HttpErrorResponse) => {
            this.logger.error('Error retrieving single grouped open-data measurement', error);
            observer.error();
          },
          () => observer.complete()
        );
    });
  }

  public exportSingleOpenDataMeasurement(openDataUuid: string, coarse: boolean, extension: string) {
    //window.open(Location.joinWithSlash(this.config.servers.search, 'measurements/' + openDataUuid + '.' + extension)); // this opens a new window in Electron...
    window.location.href = Location.joinWithSlash(
      this.config.servers.search,
      'measurements/' + openDataUuid + '.' + extension + (coarse ? '?coarse=true' : '')
    );
  }
}
