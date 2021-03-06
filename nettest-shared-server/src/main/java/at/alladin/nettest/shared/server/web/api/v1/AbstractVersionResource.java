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

package at.alladin.nettest.shared.server.web.api.v1;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.info.BuildProperties;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

import at.alladin.nettest.shared.berec.collector.api.v1.dto.ApiResponse;
import at.alladin.nettest.shared.berec.collector.api.v1.dto.version.VersionResponse;
import at.alladin.nettest.shared.server.helper.ResponseHelper;

/**
 * This class is used to return version information for each service.
 * 
 * @author alladin-IT GmbH (bp@alladin.at)
 *
 */
public abstract class AbstractVersionResource {
	
	@Autowired(required = false)
	protected BuildProperties buildProperties;
	
	/**
	 * Gets the correct version response for the service.
	 * 
	 * @return The version response.
	 */
	public abstract VersionResponse getVersionResponse();
	
	////
	
	/**
	 * Returns the build version information.
	 * 
	 * @return Build version information string.
	 */
	protected String getVersionInformation() {
		if (buildProperties != null) {
			return buildProperties.getVersion() + 
					" (" + buildProperties.get("build_date") + ")" + 
					", " + buildProperties.get("git.version_string");
		}
		
		return "0.0.0 (unknown)";
	}
	
	/**
	 * Get the server version.
	 * Returns the software version of this service.
	 *
	 * @return
	 */
	@io.swagger.annotations.ApiOperation(value = "Get the server version.", notes = "Returns the software version of the controller.")
	/*@io.swagger.annotations.ApiResponses({
		//@io.swagger.annotations.ApiResponse(code = 200, message = "OK"),
		//@io.swagger.annotations.ApiResponse(code = 400, message = "Bad Request", response = ApiResponse.class),
		//@io.swagger.annotations.ApiResponse(code = 500, message = "Internal Server Error", response = ApiResponse.class)
	})*/
	@GetMapping(produces = MediaType.APPLICATION_JSON_UTF8_VALUE)
    public ResponseEntity<ApiResponse<VersionResponse>> getVersion() {
		return ResponseHelper.ok(getVersionResponse());
	}
}
