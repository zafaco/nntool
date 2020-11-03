/*!
    \file ios_connector.h
    \author zafaco GmbH <info@zafaco.de>
    \author alladin-IT GmbH <info@alladin.at>
    \date Last update: 2020-11-03

    Copyright (C) 2016 - 2020 zafaco GmbH
    Copyright (C) 2019 alladin-IT GmbH

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License version 3
    as published by the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/




#import <Foundation/Foundation.h>

@interface IosConnector : NSObject

+(void)callback:(NSString *_Nonnull)str;
-(void)start:(NSDictionary *_Nonnull)measurementParameters callback:(void (^_Nonnull)(NSDictionary<NSString *, id> * __nonnull json))callback;
-(void)stop;

@end
