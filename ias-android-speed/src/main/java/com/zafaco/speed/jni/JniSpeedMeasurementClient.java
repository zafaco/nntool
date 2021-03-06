/*!
    \file JniSpeedMeasurementClient.java
    \author zafaco GmbH <info@zafaco.de>
    \author alladin-IT GmbH <info@alladin.at>
    \date Last update: 2019-11-13

    Copyright (C) 2016 - 2019 zafaco GmbH
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

package com.zafaco.speed.jni;

import android.support.annotation.Keep;
import android.util.Log;

import java.util.ArrayList;
import java.util.List;

import com.zafaco.speed.JniSpeedMeasurementResult;
import com.zafaco.speed.SpeedMeasurementState;
import com.zafaco.speed.SpeedTaskDesc;
import com.zafaco.speed.jni.exception.AndroidJniCppException;

public class JniSpeedMeasurementClient {

    static {
        System.loadLibrary("ias-client");
    }

    private static final String TAG = "SPEED_MEASUREMENT_JNI";

    private SpeedMeasurementState speedMeasurementState;

    private final SpeedTaskDesc speedTaskDesc;

    private List<MeasurementStringListener> stringListeners = new ArrayList<>();

    private List<MeasurementFinishedStringListener> finishedStringListeners = new ArrayList<>();

    private List<MeasurementFinishedListener> finishedListeners = new ArrayList<>();

    private List<MeasurementPhaseListener> measurementPhaseListeners = new ArrayList<>();

    private SpeedMeasurementState.MeasurementPhase previousMeasurementPhase = SpeedMeasurementState.MeasurementPhase.INIT;

    public JniSpeedMeasurementClient(final SpeedTaskDesc speedTaskDesc) {
        this.speedTaskDesc = speedTaskDesc;
        speedMeasurementState = new SpeedMeasurementState();
        shareMeasurementState(speedTaskDesc, speedMeasurementState, speedMeasurementState.getPingMeasurement(), speedMeasurementState.getDownloadMeasurement(), speedMeasurementState.getUploadMeasurement());
    }

    @Keep
    public void cppCallback(final String message) {
        if (previousMeasurementPhase != speedMeasurementState.getMeasurementPhase()) {
            Log.d(TAG, "Previous state: " + previousMeasurementPhase.toString() + " current state: " + speedMeasurementState.getMeasurementPhase().toString());
            for(MeasurementPhaseListener l : measurementPhaseListeners) {
                l.onMeasurementPhaseFinished(previousMeasurementPhase);
                l.onMeasurementPhaseStarted(speedMeasurementState.getMeasurementPhase());
            }
            previousMeasurementPhase = speedMeasurementState.getMeasurementPhase();
        }
        Log.d(TAG, message);
        for(MeasurementStringListener l : stringListeners)
        {
            if(!message.isEmpty())
                l.onMeasurement(message);
        }
    }

    @Keep
    public void cppCallbackFinished (final String message, final JniSpeedMeasurementResult result) {
        Log.d(TAG, message);
        for (MeasurementFinishedStringListener l : finishedStringListeners) {
            l.onMeasurementFinished(message);
        }
        for (MeasurementFinishedListener l : finishedListeners) {
            l.onMeasurementFinished(result, speedTaskDesc);
        }
        Log.d(TAG, result.toString());
    }

    public SpeedMeasurementState getSpeedMeasurementState() {
        return speedMeasurementState;
    }

    public native void startMeasurement() throws AndroidJniCppException;

    public native void stopMeasurement() throws AndroidJniCppException;

    /**
     * Call this method before starting a test to allow the cpp impl to write the current state into the passed JniSpeedMeasurementState obj
     * Is automatically called for the devs in the constructor
     */
    private native void shareMeasurementState(final SpeedTaskDesc speedTaskDesc, final SpeedMeasurementState speedMeasurementState, final SpeedMeasurementState.PingPhaseState pingMeasurementState,
                                              final SpeedMeasurementState.SpeedPhaseState downloadMeasurementState, final SpeedMeasurementState.SpeedPhaseState uploadMeasurementState);

    public void addMeasurementListener(final MeasurementStringListener listener) {
        stringListeners.add(listener);
    }

    public void addMeasurementFinishedListener(final MeasurementFinishedStringListener listener) {
        finishedStringListeners.add(listener);
    }

    public void addMeasurementFinishedListener(final MeasurementFinishedListener listener) {
        finishedListeners.add(listener);
    }

    public void removeMeasurementFinishedListener(final MeasurementFinishedStringListener listener) {
        finishedStringListeners.remove(listener);
    }

    public void removeMeasurementFinishedListener(final MeasurementFinishedListener listener) {
        finishedListeners.remove(listener);
    }

    public void addMeasurementPhaseListener (final MeasurementPhaseListener listener) {
        measurementPhaseListeners.add(listener);
    }

    public void removeMeasurementPhaseListener (final MeasurementPhaseListener listener) {
        measurementPhaseListeners.remove(listener);
    }

    public interface MeasurementStringListener {
        void onMeasurement (final String result);
    }

    public interface MeasurementFinishedStringListener {

        void onMeasurementFinished (final String result);

    }

    public interface MeasurementFinishedListener {

        void onMeasurementFinished (final JniSpeedMeasurementResult result, final SpeedTaskDesc taskDesc);
    }

    public interface MeasurementPhaseListener {
        void onMeasurementPhaseStarted (final SpeedMeasurementState.MeasurementPhase startedPhase);

        void onMeasurementPhaseFinished (final SpeedMeasurementState.MeasurementPhase finishedPhase);
    }
}
