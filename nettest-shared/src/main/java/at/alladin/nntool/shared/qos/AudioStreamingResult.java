package at.alladin.nntool.shared.qos;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * @author Felix Kendlbacher (alladin-IT GmbH)
 */
public class AudioStreamingResult extends AbstractResult {

	public final static String TOTAL_NUMBER_OF_STALLS = "number_of_stalls";

	public final static String TOTAL_STALL_TIME = "total_stall_time_ns";

	public final static String AVG_STALL_TIME = "average_stall_time_ns";

	/**
	 * The time it took from start playing command to the actual start of the audio stream
	 */
	@JsonProperty("audio_start_time_ns")
	private Object audioStartTime;
	
	@JsonProperty("stalls_ns")
	private List<Long> stallsNs;
	
	@JsonProperty(AVG_STALL_TIME)
	private Object averageStallTime;
	
	@JsonProperty(TOTAL_NUMBER_OF_STALLS)
	private Object numberOfStalls;
	
	@JsonProperty(TOTAL_STALL_TIME)
	private Object totalStallTime;
	
	@JsonProperty("audio_streaming_objective_target_url")
	private String targetUrl;
	
	@JsonProperty("audio_streaming_objective_buffer_duration_ns")
	private String bufferDurationNs;
	
	@JsonProperty("audio_streaming_objective_playback_duration_ns")
	private Object playbackDurationNs;

	public Object getAudioStartTime() {
		return audioStartTime;
	}

	public void setAudioStartTime(Object audioStartTime) {
		this.audioStartTime = audioStartTime;
	}

	public List<Long> getStallsNs() {
		return stallsNs;
	}

	public void setStallsNs(List<Long> stallsNs) {
		this.stallsNs = stallsNs;
	}

	public Object getAverageStallTime() {
		return averageStallTime;
	}

	public void setAverageStallTime(Object averageStallTime) {
		this.averageStallTime = averageStallTime;
	}

	public Object getNumberOfStalls() {
		return numberOfStalls;
	}

	public void setNumberOfStalls(Object numberOfStalls) {
		this.numberOfStalls = numberOfStalls;
	}

	public Object getTotalStallTime() {
		return totalStallTime;
	}

	public void setTotalStallTime(Object totalStallTime) {
		this.totalStallTime = totalStallTime;
	}

	public String getTargetUrl() {
		return targetUrl;
	}

	public void setTargetUrl(String targetUrl) {
		this.targetUrl = targetUrl;
	}
	
	public String getBufferDurationNs() {
		return bufferDurationNs;
	}
	
	public void setBufferDurationNs(String bufferDurationNs) {
		this.bufferDurationNs = bufferDurationNs;
	}

	public Object getPlaybackDurationNs() {
		return playbackDurationNs;
	}

	public void setPlaybackDurationNs(Object playbackDurationNs) {
		this.playbackDurationNs = playbackDurationNs;
	}
}
