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

package at.alladin.nettest.service.collector;

import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;

import at.alladin.nettest.service.collector.config.CollectorServiceProperties;
import at.alladin.nettest.service.collector.config.ExternalServicesProperties;
import at.alladin.nettest.shared.server.config.spring.DevelopmentWebCorsConfiguration;
import at.alladin.nettest.shared.server.config.spring.MessageSourceConfiguration;
import at.alladin.nettest.shared.server.helper.spring.SpringApplicationHelper;
import at.alladin.nettest.shared.server.storage.couchdb.config.EnableCouchDbStorage;

/**
 * The collector's main class which allows the collector to be started as stand-alone Java application or inside a servlet container.
 * 
 * @author alladin-IT GmbH (bp@alladin.at)
 *
 */
@SpringBootApplication
@EnableAutoConfiguration(exclude = {
	DataSourceAutoConfiguration.class // will be included based on property spring.datasource.url
})
@EnableConfigurationProperties({
	CollectorServiceProperties.class,
	ExternalServicesProperties.class,
})
@ComponentScan({
	"at.alladin.nettest.service.collector", 
	"at.alladin.nettest.shared.server.opendata.service",
	"at.alladin.nettest.shared.server.web.api.v1",
})
@Import({
	DevelopmentWebCorsConfiguration.class,
	MessageSourceConfiguration.class
})
@EnableCouchDbStorage
public class CollectorServiceApplication extends SpringBootServletInitializer {

	/**
	 * 
	 */
	private static final String CONFIGURATION_DIRECTORY_NAME = "collector-service";
	
	/**
	 * 
	 */
	private static final Class<?> APPLICATION_CLASS = CollectorServiceApplication.class;
	
	/*
	 * (non-Javadoc)
	 * @see org.springframework.boot.context.web.SpringBootServletInitializer#configure(org.springframework.boot.builder.SpringApplicationBuilder)
	 */
	@Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return SpringApplicationHelper.configure(CONFIGURATION_DIRECTORY_NAME, application, APPLICATION_CLASS);
    }
	
	/**
	 * 
	 * @param args
	 * @throws Exception
	 */
	public static void main(String[] args) throws Exception {
		SpringApplicationHelper.runSpingApplication(CONFIGURATION_DIRECTORY_NAME, args, APPLICATION_CLASS);
	}
}
