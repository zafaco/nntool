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

package at.alladin.nettest.nntool.android.app.workflow.result.qos;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

import java.util.List;

import at.alladin.nettest.nntool.android.app.R;
import at.alladin.nettest.nntool.android.app.view.AlladinTextView;
import at.alladin.nettest.shared.berec.collector.api.v1.dto.measurement.full.FullQoSMeasurement;

/**
 * @author Felix Kendlbacher (alladin-IT GmbH)
 */
public class ResultQoSAdapter extends ArrayAdapter<QoSBoxResult> {

    private final FullQoSMeasurement fullQoSMeasurement;

    private final Context context;

    public ResultQoSAdapter(final Context context, final List<QoSBoxResult> qoSBoxResultList, final FullQoSMeasurement fullQoSMeasurement) {
        super(context, R.layout.qos_result_grid_box, qoSBoxResultList);
        this.fullQoSMeasurement = fullQoSMeasurement;
        this.context = context;
    }

    private class ViewHolder {
        AlladinTextView icon;
        TextView name;
        TextView successCount;
    }

    @NonNull
    @Override
    public View getView(int position, @Nullable View convertView, @NonNull ViewGroup parent) {
        final QoSBoxResult item = getItem(position);

        ResultQoSAdapter.ViewHolder viewHolder;
        if (convertView == null) {
            convertView = LayoutInflater.from(getContext()).inflate(R.layout.qos_result_grid_box, parent, false);
            viewHolder = new ResultQoSAdapter.ViewHolder();
            viewHolder.icon = convertView.findViewById(R.id.result_qos_group_icon);
            viewHolder.name = convertView.findViewById(R.id.result_qos_group_name);
            viewHolder.successCount = convertView.findViewById(R.id.result_qos_success_count);
            convertView.setTag(viewHolder);
        }
        else {
            viewHolder = (ResultQoSAdapter.ViewHolder) convertView.getTag();
        }

        if (item.getIcon() != null) {
            //TODO: remove temporary fix to overly long icons
            viewHolder.icon.setText(item.getIcon().substring(0, 1));
        }
        if (item.getName() != null) {
            viewHolder.name.setText(item.getName());
        }
        if (item.getEvaluationCount() != null && item.getSuccessCount() != null) {
            viewHolder.successCount.setText(String.format("%d/%d", item.getSuccessCount(), item.getEvaluationCount()));
        }

        return convertView;
    }


}
