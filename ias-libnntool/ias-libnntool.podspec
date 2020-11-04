#/*!
#    \file android_connector.cpp
#    \author zafaco GmbH <info@zafaco.de>
#    \author alladin-IT GmbH <info@alladin.at>
#    \date Last update: 2020-11-03
#
#    Copyright (C) 2016 - 2020 zafaco GmbH
#    Copyright (C) 2019 alladin-IT GmbH

#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License version 3 
#    as published by the Free Software Foundation.

#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.

#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#*/

Pod::Spec.new do |s|
  s.name             = 'ias-libnntool'
  s.version          = '1.0.0'
  s.summary          = 'IAS-libnntool for iOS'

  s.description      = 'ias-libnntool for iOS'

  s.homepage         = 'https://net-neutrality.tools'
  s.license          = { :type => 'AGPL', :file => 'LICENSE' }
  s.authors          = 'alladin-IT GmbH, zafaco GmbH'

  s.source           = {
    :git => 'https://gitlab.berec.alladin.at/berec-nnt/nntool-eu',
  }

  s.ios.deployment_target = '10.0'

  s.cocoapods_version = '>= 1.4.0'
  s.static_framework = true
  s.prefix_header_file = false

  s.source_files = [
    '*.{h,m,mm,cpp}',
    'external/*.{h,m,mm,cpp}'
  ]
 
  s.exclude_files = [
    '*_test.cpp'
  ]

  s.dependency 'BoringSSL', '10.0.6'

  s.ios.frameworks = 'MobileCoreServices', 'SystemConfiguration'

  s.library = 'c++'
  s.pod_target_xcconfig = {
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++14',
    'GCC_PREPROCESSOR_DEFINITIONS' => 'NNTOOL=1 NNTOOL_CLIENT=1 NNTOOL_IOS=1'
  }

  s.compiler_flags = '$(inherited) -Wreorder -Werror=reorder'
end
