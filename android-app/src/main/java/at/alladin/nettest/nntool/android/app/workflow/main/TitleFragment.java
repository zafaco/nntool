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

package at.alladin.nettest.nntool.android.app.workflow.main;

import android.app.AlertDialog;
import android.content.Context;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.FragmentTransaction;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import at.alladin.nettest.nntool.android.app.MainActivity;
import at.alladin.nettest.nntool.android.app.R;
import at.alladin.nettest.nntool.android.app.async.OnTaskFinishedCallback;
import at.alladin.nettest.nntool.android.app.async.RequestAgentIpTask;
import at.alladin.nettest.nntool.android.app.async.RequestMeasurementTask;
import at.alladin.nettest.nntool.android.app.async.RequestSpeedMeasurementPeersTask;
import at.alladin.nettest.nntool.android.app.util.AlertDialogUtil;
import at.alladin.nettest.nntool.android.app.util.LmapUtil;
import at.alladin.nettest.nntool.android.app.util.PreferencesUtil;
import at.alladin.nettest.nntool.android.app.util.info.InformationProvider;
import at.alladin.nettest.nntool.android.app.util.info.gps.GeoLocationGatherer;
import at.alladin.nettest.nntool.android.app.util.info.interfaces.TrafficGatherer;
import at.alladin.nettest.nntool.android.app.util.info.network.NetworkChangeEvent;
import at.alladin.nettest.nntool.android.app.util.info.network.NetworkChangeListener;
import at.alladin.nettest.nntool.android.app.util.info.network.NetworkGatherer;
import at.alladin.nettest.nntool.android.app.util.info.signal.SignalGatherer;
import at.alladin.nettest.nntool.android.app.view.GeoLocationView;
import at.alladin.nettest.nntool.android.app.view.InterfaceTrafficView;
import at.alladin.nettest.nntool.android.app.view.Ipv4v6View;
import at.alladin.nettest.nntool.android.app.view.MeasurementServerSelectionView;
import at.alladin.nettest.nntool.android.app.view.ProviderAndSignalView;
import at.alladin.nettest.nntool.android.app.workflow.ActionBarFragment;
import at.alladin.nettest.nntool.android.app.workflow.WorkflowParameter;
import at.alladin.nettest.nntool.android.app.workflow.WorkflowTarget;
import at.alladin.nettest.nntool.android.app.workflow.measurement.MeasurementService;
import at.alladin.nettest.nntool.android.app.workflow.measurement.MeasurementType;
import at.alladin.nettest.nntool.android.app.workflow.tc.TermsAndConditionsFragment;
import at.alladin.nettest.shared.berec.collector.api.v1.dto.ip.IpResponse;
import at.alladin.nntool.shared.qos.QosMeasurementType;

/**
 * @author Lukasz Budryk (alladin-IT GmbH)
 */
public class TitleFragment extends ActionBarFragment implements NetworkChangeListener {

    private final static String TAG = TitleFragment.class.getSimpleName();

    private ProviderAndSignalView providerSignalView;

    private GeoLocationView geoLocationView;

    private InterfaceTrafficView interfaceTrafficView;

    private Ipv4v6View ipv4v6View;

    private InformationProvider informationProvider;

    private MeasurementServerSelectionView measurementServerSelectionView;

    private WorkflowTitleParameter workflowTitleParameter;

    public static TitleFragment newInstance () {
        return newInstance(null);
    }

    /**
     *
     * @return
     */
    public static TitleFragment newInstance (final WorkflowParameter workflowParameter) {
        final TitleFragment fragment = new TitleFragment();
        if (workflowParameter instanceof WorkflowTitleParameter) {
            fragment.setWorkflowTitleParameter((WorkflowTitleParameter) workflowParameter);
        }
        return fragment;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {

        if (workflowTitleParameter != null && workflowTitleParameter.isShowTermsAndConditionsOnLoad()) {
            final TermsAndConditionsFragment f = TermsAndConditionsFragment.newInstance();
            final FragmentTransaction ft = getActivity().getSupportFragmentManager().beginTransaction();
            f.show(ft, TermsAndConditionsFragment.TERMS_FRAGMENT_TAG);
        }

        super.onCreate(savedInstanceState);
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        final View v = inflater.inflate(R.layout.fragment_title, container, false);

        final View startButton = v.findViewById(R.id.title_page_start_button);
        startButton.setOnClickListener(getNewOnClickListener());

        providerSignalView = v.findViewById(R.id.view_provider_signal);

        geoLocationView = v.findViewById(R.id.view_geo_location);

        interfaceTrafficView = v.findViewById(R.id.view_interface_traffic);

        ipv4v6View = v.findViewById(R.id.view_ipv4v6_status);

        measurementServerSelectionView = v.findViewById(R.id.view_measurement_server_selection);

        final RequestSpeedMeasurementPeersTask measurementPeersTask = new RequestSpeedMeasurementPeersTask(getContext(), response -> {
            if (response != null) {
                measurementServerSelectionView.updateServerList(response);
            } else {
                final MainActivity activity = ((MainActivity) getContext());
                if (activity != null) {
                    activity.setSelectedMeasurementPeerIdentifier(null);
                }
                Log.e(TAG, "Failed to fetch measurement peers");
            }
        });

        measurementPeersTask.execute();

        refreshAgentIp();

        //Log.i(TAG, "onCreateView");
        return v;
    }

    private void startMeasurement() {
        final RequestMeasurementTask task = new RequestMeasurementTask(((MainActivity)getActivity()).getSelectedMeasurementPeerIdentifier(), getContext(),
                new OnTaskFinishedCallback<LmapUtil.LmapTaskWrapper>() {
                    @Override
                    public void onTaskFinished(LmapUtil.LmapTaskWrapper result) {
                        if (result != null &&
                                (result.getSpeedTaskDesc() != null || (result.getTaskDescList() != null && result.getTaskDescList().size() > 0))){

                            //fetch private ip, check if ipv6 measurement is desired
                            Map<IpResponse.IpVersion, RequestAgentIpTask.IpResponseWrapper> ipResponse = null;
                            try {
                                final RequestAgentIpTask requestAgentIpTask = new RequestAgentIpTask(getContext(), null);
                                requestAgentIpTask.execute();
                                ipResponse = requestAgentIpTask.get(30, TimeUnit.SECONDS);
                            } catch (Exception ex) {
                                ex.printStackTrace();
                                Log.e(TAG, "Failed to obtain client ip addresses, proceeding w/ipv4");
                            }

                            final Bundle bundle = new Bundle();
                            bundle.putSerializable(MeasurementService.EXTRAS_KEY_QOS_TASK_DESC_LIST,
                                    (Serializable) result.getTaskDescList());
                            bundle.putSerializable(MeasurementService.EXTRAS_KEY_QOS_TASK_COLLECTOR_URL,
                                    result.getCollectorUrl());
                            bundle.putSerializable(MeasurementService.EXTRAS_KEY_SPEED_TASK_COLLECTOR_URL,
                                    result.getSpeedCollectorUrl());
                            bundle.putSerializable(MeasurementService.EXTRAS_KEY_SPEED_TASK_DESC,
                                    result.getSpeedTaskDesc());

                            if (ipResponse != null) {
                                for (Map.Entry<IpResponse.IpVersion, RequestAgentIpTask.IpResponseWrapper> e : ipResponse.entrySet()) {
                                    final RequestAgentIpTask.IpResponseWrapper val = e.getValue();
                                    if (val == null) {
                                        continue;
                                    }
                                    String ipPrivate = null;
                                    String ipPublic = null;
                                    switch (e.getKey()) {
                                        case IPv4:
                                            ipPrivate = MeasurementService.EXTRAS_KEY_SPEED_TASK_CLIENT_IPV4_PRIVATE;
                                            ipPublic = MeasurementService.EXTRAS_KEY_SPEED_TASK_CLIENT_IPV4_PUBLIC;
                                            break;
                                        case IPv6:
                                            ipPrivate = MeasurementService.EXTRAS_KEY_SPEED_TASK_CLIENT_IPV6_PRIVATE;
                                            ipPublic = MeasurementService.EXTRAS_KEY_SPEED_TASK_CLIENT_IPV6_PUBLIC;
                                            break;
                                    }
                                    if (ipPrivate != null && val.getLocalAddress() != null && val.getLocalAddress().getHostAddress() != null) {
                                        bundle.putSerializable(ipPrivate, e.getValue().getLocalAddress().getHostAddress());
                                    }
                                    if (ipPublic != null && val.getIpResponse() != null && val.getIpResponse().getIpAddress() != null) {
                                        bundle.putSerializable(ipPublic, e.getValue().getIpResponse().getIpAddress());
                                    }
                                }
                            }

                            final ArrayList<MeasurementType> followUpActions = new ArrayList<>();

                            final Context context = getContext();
                            if (PreferencesUtil.isQoSEnabled(context)) {
                                boolean isQoSTypeEnabled = false;
                                for (QosMeasurementType t : QosMeasurementType.values()) {
                                    if (PreferencesUtil.isQoSTypeEnabled(context, t)) {
                                        isQoSTypeEnabled = true;
                                        break;
                                    }
                                }
                                if (isQoSTypeEnabled) {
                                    followUpActions.add(MeasurementType.QOS);
                                    bundle.putBoolean(MeasurementService.EXTRAS_KEY_QOS_EXECUTE, true);
                                } else {
                                    bundle.putBoolean(MeasurementService.EXTRAS_KEY_QOS_EXECUTE, false);
                                }
                            } else {
                                bundle.putBoolean(MeasurementService.EXTRAS_KEY_QOS_EXECUTE, false);
                            }

                            MeasurementType toExecute = null;
                            if (PreferencesUtil.isSpeedEnabled(context) &&
                                    (PreferencesUtil.isPingEnabled(context) || PreferencesUtil.isDownloadEnabled(context) || PreferencesUtil.isUploadEnabled(context))) {
                                toExecute = MeasurementType.SPEED;
                                bundle.putBoolean(MeasurementService.EXTRAS_KEY_SPEED_EXECUTE, true);
                            } else if (followUpActions.size() > 0) {
                                bundle.putBoolean(MeasurementService.EXTRAS_KEY_SPEED_EXECUTE, false);
                                toExecute = followUpActions.remove(0);

                            }

                            bundle.putSerializable(MeasurementService.EXTRAS_KEY_FOLLOW_UP_ACTIONS, followUpActions);

                            if (toExecute != null) {
                                ((MainActivity) getActivity()).startMeasurement(toExecute, bundle);
                            } else {
                                AlertDialogUtil.showCustomDialog(getContext(), R.string.alert_no_measurement_selected_title, R.string.alert_no_measurement_selected_content, R.string.alert_no_measurement_selected_to_settings, android.R.string.ok,
                                        (dialog, which) -> {
                                            ((MainActivity) getActivity()).navigateTo(WorkflowTarget.SETTINGS);
                                            dialog.cancel();
                                        }, null);
                            }

                        }
                    }
                });

        task.execute();
    }

    @Override
    public void onResume() {
        super.onResume();
        startInformationProvider();
    }

    @Override
    public void onPause() {
        stopInformationProvider();
        super.onPause();
    }

    public void startInformationProvider() {
        informationProvider = InformationProvider.createDefault(getContext());

        informationProvider.start();

        final NetworkGatherer networkGatherer = informationProvider.getGatherer(NetworkGatherer.class);
        final SignalGatherer signalGatherer = informationProvider.getGatherer(SignalGatherer.class);
        final GeoLocationGatherer geoLocationGatherer = informationProvider.getGatherer(GeoLocationGatherer.class);
        final TrafficGatherer trafficGatherer = informationProvider.getGatherer(TrafficGatherer.class);

        if (networkGatherer != null && providerSignalView != null) {
            networkGatherer.addListener(providerSignalView);
            networkGatherer.addListener(this);
        }

        if (signalGatherer != null && providerSignalView != null) {
            signalGatherer.addListener(providerSignalView);
        }

        if (geoLocationGatherer != null && geoLocationView != null) {
            geoLocationGatherer.addListener(geoLocationView);
        }

        if (trafficGatherer != null && interfaceTrafficView != null) {
            trafficGatherer.addListener(interfaceTrafficView);
        }

    }

    public void stopInformationProvider() {
        if (informationProvider == null) {
            return;
        }

        informationProvider.stop();

        final NetworkGatherer networkGatherer = informationProvider.getGatherer(NetworkGatherer.class);
        if (networkGatherer != null && providerSignalView != null) {
            networkGatherer.removeListener(providerSignalView);
            networkGatherer.removeListener(this);
        }

        final SignalGatherer signalGatherer = informationProvider.getGatherer(SignalGatherer.class);
        if (signalGatherer != null && providerSignalView != null) {
            signalGatherer.removeListener(providerSignalView);
        }

        final GeoLocationGatherer geoLocationGatherer = informationProvider.getGatherer(GeoLocationGatherer.class);
        if (geoLocationGatherer != null && geoLocationView != null) {
            geoLocationGatherer.removeListener(geoLocationView);
        }

        final TrafficGatherer trafficGatherer = informationProvider.getGatherer(TrafficGatherer.class);
        if (trafficGatherer != null && interfaceTrafficView != null) {
            trafficGatherer.removeListener(interfaceTrafficView);
        }

    }

    protected View.OnClickListener getNewOnClickListener () {
        return new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (getResources().getBoolean(R.bool.functionality_data_consumption_warning_enabled)) {
                    final String message = getResources().getString(R.string.functionality_data_consumption_warning_message);
                    AlertDialog alert = new AlertDialog.Builder(getActivity())
                            .setPositiveButton(android.R.string.ok,
                                    (dialog, w) -> startMeasurement())
                            .setNegativeButton(android.R.string.cancel,
                                    (dialog, w) -> Log.d(TAG, "Data consumption warning declined"))
                            .setMessage(message)
                            .setCancelable(false)
                            .create();

                    alert.show();
                }
                else {
                    startMeasurement();
                }
            }
        };
    }

    @Override
    public Integer getTitleStringId() {
        return R.string.app_name;
    }

    @Override
    public Integer getHelpSectionStringId() {
        return null;
    }

    public WorkflowTitleParameter getWorkflowTitleParameter() {
        return workflowTitleParameter;
    }

    public void setWorkflowTitleParameter(WorkflowTitleParameter workflowTitleParameter) {
        this.workflowTitleParameter = workflowTitleParameter;
    }


    AtomicBoolean isRefreshingIp = new AtomicBoolean(false);
    boolean lostNetworkConnection = false;
    Integer lastNetworkId = null;

    public void refreshAgentIp() {
        if (!isRefreshingIp.getAndSet(true)) {
            try {
                final RequestAgentIpTask requestAgentIpTask = new RequestAgentIpTask(getContext(), response -> {
                    ipv4v6View.updateIpStatus(response);
                    isRefreshingIp.set(false);
                });

                requestAgentIpTask.execute();
            }
            catch (final Exception e) {
                e.printStackTrace();
                isRefreshingIp.set(false);
            }
        }
    }

    @Override
    public void onNetworkChange(NetworkChangeEvent event) {
        if (event == null) {
            return;
        }

        Log.i(TAG, "network change event: " + event);

        boolean hasRefreshIpStarted = false;

        if (NetworkChangeEvent.NetworkChangeEventType.NO_CONNECTION.equals(event.getEventType())) {
            lostNetworkConnection = true;
        }
        else if (lostNetworkConnection && !NetworkChangeEvent.NetworkChangeEventType.NO_CONNECTION.equals(event.getEventType())) {
            Log.i(TAG,"Lost and reestablished connection. Refreshing IPs!");
            lostNetworkConnection = false;
            hasRefreshIpStarted = true;
            refreshAgentIp();
        }

        if (!hasRefreshIpStarted && (lastNetworkId == null || lastNetworkId != event.getNetworkType())) {
            lastNetworkId = event.getNetworkType();
            Log.i(TAG,"NetworkType change detected. Refreshing IPs!");
            refreshAgentIp();
        }
    }
}
