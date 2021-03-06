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

package at.alladin.nettest.service.map.web.api.v0;

import java.util.Locale;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import at.alladin.nettest.service.map.service.MarkerService;
import at.alladin.nntool.shared.map.MapMarkerRequest;
import at.alladin.nntool.shared.map.MapMarkerResponse;
import springfox.documentation.annotations.ApiIgnore;


@RestController
@RequestMapping("/api/v0/tiles/markers")
public class MarkerResource {

	@Autowired
	private MarkerService markerService;
    
	//TODO: BIG! Restrict CrossOrigin requests if possible
	@CrossOrigin
    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.TEXT_PLAIN_VALUE})
    public ResponseEntity<MapMarkerResponse> obtainMarker(
    		@RequestBody MapMarkerRequest request,
			@ApiIgnore Locale locale) {
    	return ResponseEntity.ok(markerService.obtainMarker(request, locale));
    }
	
}
