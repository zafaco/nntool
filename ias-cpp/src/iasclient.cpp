/*!
    \file iasclient.cpp
    \author zafaco GmbH <info@zafaco.de>
    \date Last update: 2020-11-03

    Copyright (C) 2016 - 2020 zafaco GmbH

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

#include "header.h"
#include "callback.h"
#include "timer.h"
#include "measurement.h"




/*--------------Global Variables--------------*/

bool _DEBUG_;
bool RUNNING;
bool UNREACHABLE;
bool FORBIDDEN;
bool OVERLOADED;
const char* PLATFORM;
const char* CLIENT_OS;

unsigned long long TCP_STARTUP;

bool RTT;
bool DOWNLOAD;
bool UPLOAD;

std::atomic_bool hasError;
std::exception recentException;

bool TIMER_ACTIVE;
bool TIMER_RUNNING;
bool TIMER_STOPPED;

int TIMER_INDEX;
int TIMER_DURATION;
unsigned long long MEASUREMENT_DURATION;
long long TIMESTAMP_MEASUREMENT_START;

bool PERFORMED_RTT;
bool PERFORMED_DOWNLOAD;
bool PERFORMED_UPLOAD;

struct conf_data conf;
struct measurement measurements;

vector<char> randomDataValues;

pthread_mutex_t mutex1 = PTHREAD_MUTEX_INITIALIZER;

map<int,int> syncing_threads;
pthread_mutex_t mutex_syncing_threads = PTHREAD_MUTEX_INITIALIZER;

std::unique_ptr<CConfigManager> pConfig;
std::unique_ptr<CConfigManager> pXml;
std::unique_ptr<CConfigManager> pService;

std::unique_ptr<CCallback> pCallback;

MeasurementPhase currentTestPhase = MeasurementPhase::INIT;

std::function<void(int)> signalFunction = nullptr;

/*--------------Forward declarations--------------*/

void        show_usage      	(char* argv0);
void		measurementStart	(string measurementParameters);
void		measurementStop		();
void 		startTestCase		(int nTestCase);
void		shutdown			();
static void signal_handler  	(int signal);


/*--------------Beginning of Program--------------*/

#ifndef NNTOOL_IOS
	int main(int argc, char** argv)
	{
		::_DEBUG_ 			= false;
		::RUNNING 			= true;

		::RTT				= false;
		::DOWNLOAD 			= false;
		::UPLOAD 			= false;

		long int opt;
		int tls = 0;
		string target_port = "80";
		string auth_token;
		string auth_timestamp;

		while ( ( opt = getopt( argc, argv, "rdutp:nhva:m:" ) ) != -1 )
		{
			switch (opt)
			{
				case 'r':
					::RTT = true;
					break;
				case 'd':
					::DOWNLOAD = true;
					break;
				case 'u':
					::UPLOAD = true;
					break;
				case 't':
					tls = 1;
					break;
				case 'p':
					if (optarg == NULL)
					{
		                show_usage(argv[0]);
	                	return EXIT_SUCCESS;
	                }
					target_port = optarg;
					break;
				case 'n':
					::_DEBUG_ = true;
					break;
				case 'h':
	                show_usage(argv[0]);
                	return EXIT_SUCCESS;
				case 'v':
					cout << "ias client" << endl;
					cout << "Version: " << VERSION << endl;
					return 0;
				case 'a':
					auth_token = optarg;
					break;
				case 'm':
					auth_timestamp = optarg;
					break;
				case '?':
				default:
					printf("Error: Unknown Argument -%c\n", optopt);
					show_usage(argv[0]);
					return EXIT_FAILURE;
			}
		}

		if (!::RTT && !::DOWNLOAD && !::UPLOAD)
		{
			printf("Error: At least one test case is required");
			show_usage(argv[0]);
	        return EXIT_FAILURE;
		}

		/*-------------------------set parameters for demo implementation start------------------------*/

		Json::object jRttParameters;
		Json::object jDownloadParameters;
		Json::object jUploadParameters;

		Json::object jMeasurementParameters;

		//set requested test cases
		jRttParameters["performMeasurement"] = ::RTT;
		jDownloadParameters["performMeasurement"] = ::DOWNLOAD;
		jUploadParameters["performMeasurement"] = ::UPLOAD;

		//set default measurement parameters
		jDownloadParameters["streams"] = "4";
		jUploadParameters["streams"] = "4";
		jMeasurementParameters["rtt"] = Json(jRttParameters);
		jMeasurementParameters["download"] = Json(jDownloadParameters);
		jMeasurementParameters["upload"] = Json(jUploadParameters);

		#if defined(__APPLE__) && defined(TARGET_OS_MAC)
			jMeasurementParameters["clientos"] = "macos";
		#else
			jMeasurementParameters["clientos"] = "linux";
		#endif

		jMeasurementParameters["platform"] = "desktop";
		jMeasurementParameters["wsTLD"] = "net-neutrality.tools";
		jMeasurementParameters["wsTargetPort"] = target_port;
		jMeasurementParameters["wsTargetPortRtt"] = target_port;
		jMeasurementParameters["wsWss"] = to_string(tls);
		jMeasurementParameters["wsAuthToken"] = auth_token;
		jMeasurementParameters["wsAuthTimestamp"] = auth_timestamp;

		Json::array jTargets;
		jTargets.push_back("peer-ias-de-01");
		jMeasurementParameters["wsTargets"] = Json(jTargets);
		jMeasurementParameters["wsTargetsRtt"] = Json(jTargets);

		Json jMeasurementParametersJson = jMeasurementParameters;

		/*-------------------------set parameters for demo implementation end------------------------*/

	    #ifdef NNTOOL_CLIENT
	    //register callback
	    CTrace::setLogFunction([] (std::string const & cat, std::string const  &s) { std::cout << "[" + CTool::get_timestamp_string() + "] " + cat + ": " + s + "\n"; });
	    #endif

	    //Signal Handler
	    signal(SIGFPE, signal_handler);
	    signal(SIGABRT, signal_handler);
	    signal(SIGSEGV, signal_handler);
	    signal(SIGCHLD, signal_handler);

		measurementStart(jMeasurementParametersJson.dump());
	}
#endif

/**
 * @function measurementStart
 * @description API Function to start a measurement
 * @public
 * @param {string} measurementParameters JSON coded measurement Parameters
 */
void measurementStart(string measurementParameters)
{
    ::PERFORMED_RTT 		= false;
    ::PERFORMED_DOWNLOAD 	= false;
    ::PERFORMED_UPLOAD 		= false;
    ::hasError 				= false;

	::UNREACHABLE 			= false;
	::FORBIDDEN 			= false;
	::OVERLOADED 			= false;

	::TCP_STARTUP	= 3000000;
	conf.sProvider 	= "nntool";

	Json jMeasurementParameters = Json::object{};
	string error = "";
    jMeasurementParameters = Json::parse(measurementParameters, error);

    if (error.compare("") != 0)
    {
    	TRC_ERR("JSON parameter parse failed");
    	shutdown();
    }

    //parameter 		- example 1, example 2
    //-------------------------------------------------------------
    //platform 			- "cli", "mobile"
    //clientos 			- "linux", "android", "ios"
    //wsTargets 		- ["peer-ias-de-01"]
    //wsTLD 			- "net-neutrality.tools"
    //wsTargetPort		- "80"
	//wsTargetPortRtt   - "80"
    //wsWss 			- "0"
    //rtt 				- {"performMeasurement":true}
    //download 			- {"performMeasurement":true, "streams":"4"}
    //upload 			- {"performMeasurement":true, "streams":"4"}

    ::PLATFORM = jMeasurementParameters["platform"].string_value().c_str();
    ::CLIENT_OS = jMeasurementParameters["clientos"].string_value().c_str();

	TRC_INFO("Status: ias-client started");

	//map measurement parameters to internal variables
	pConfig = std::make_unique<CConfigManager>();
	pXml 	= std::make_unique<CConfigManager>();
	pService = std::make_unique<CConfigManager>();

	Json::array jTargets = jMeasurementParameters["wsTargets"].array_items();
	string wsTLD = jMeasurementParameters["wsTLD"].string_value();

	#if defined(__ANDROID__)
		pXml->writeString(conf.sProvider, "DNS_HOSTNAME", jTargets[0].string_value());
	#else
		pXml->writeString(conf.sProvider, "DNS_HOSTNAME", jTargets[0].string_value() + "." + wsTLD);
	#endif

	pXml->writeString(conf.sProvider,"DL_PORT",jMeasurementParameters["wsTargetPort"].string_value());
	pXml->writeString(conf.sProvider,"UL_PORT",jMeasurementParameters["wsTargetPort"].string_value());
	pXml->writeString(conf.sProvider,"PING_PORT",jMeasurementParameters["wsTargetPortRtt"].string_value());

	pXml->writeString(conf.sProvider,"TLS",jMeasurementParameters["wsWss"].string_value());
	#if defined(__ANDROID__)
	    pXml->writeString(conf.sProvider, "CLIENT_IP", jMeasurementParameters["clientIp"].string_value());
	#endif

	pConfig->writeString("security","authToken",jMeasurementParameters["wsAuthToken"].string_value());
	pConfig->writeString("security","authTimestamp",jMeasurementParameters["wsAuthTimestamp"].string_value());

	Json::object jRtt = jMeasurementParameters["rtt"].object_items();
	::RTT = jRtt["performMeasurement"].bool_value();

	Json::object jDownload = jMeasurementParameters["download"].object_items();
	::DOWNLOAD = jDownload["performMeasurement"].bool_value();
	pXml->writeString(conf.sProvider,"DL_STREAMS", jDownload["streams"].string_value());

	Json::object jUpload = jMeasurementParameters["upload"].object_items();
	::UPLOAD = jUpload["performMeasurement"].bool_value();
	pXml->writeString(conf.sProvider,"UL_STREAMS", jUpload["streams"].string_value());

    #if defined(__ANDROID__)
        pXml->writeString(conf.sProvider,"PING_QUERY",jRtt["ping_query"].string_value());
    #else
	    pXml->writeString(conf.sProvider,"PING_QUERY","10");
	#endif


	pCallback = std::make_unique<CCallback>(jMeasurementParameters);

	if (!::RTT && !::DOWNLOAD && !::UPLOAD)
	{
		pCallback->callback("error", "no test case enabled", 1, "no test case enabled");

		shutdown();
	}

	//perform requested test cases
	if (::RTT)
	{
		conf.nTestCase = 2;
		conf.sTestName = "rtt_udp";
		TRC_INFO( ("Taking Testcase RTT UDP ("+CTool::toString(conf.nTestCase)+")").c_str() );
		currentTestPhase = MeasurementPhase::PING;
		startTestCase(conf.nTestCase);
	}

	#if defined(__ANDROID__)
		if (::hasError) {
			throw ::recentException;
		}
	#endif

	if (::DOWNLOAD)
	{
		conf.nTestCase = 3;
		conf.sTestName = "download";
		TRC_INFO( ("Taking Testcase DOWNLOAD ("+CTool::toString(conf.nTestCase)+")").c_str() );
		currentTestPhase = MeasurementPhase::DOWNLOAD;
		startTestCase(conf.nTestCase);
	}

	#if defined(__ANDROID__)
		if (::hasError) {
			throw ::recentException;
		}
	#endif

	if (::UPLOAD)
	{
		CTool::randomData( randomDataValues, 1123457*10 );
		conf.nTestCase = 4;
		conf.sTestName = "upload";
		TRC_INFO( ("Taking Testcase UPLOAD ("+CTool::toString(conf.nTestCase)+")").c_str() );
		currentTestPhase = MeasurementPhase::UPLOAD;
		startTestCase(conf.nTestCase);
	}

	#if defined(__ANDROID__)
		if (::hasError) {
			throw ::recentException;
		}
	#endif

	currentTestPhase = MeasurementPhase::END;

	shutdown();
}

/**
 * @function measurementStop
 * @public
 * @description API Function to stop a measurement
 */
void measurementStop()
{
	shutdown();
}

void startTestCase(int nTestCase)
{
	pthread_mutex_lock(&mutex_syncing_threads);
	syncing_threads.clear();
	pthread_mutex_unlock(&mutex_syncing_threads);
	pCallback->mTestCase = nTestCase;
	#if defined(__ANDROID__) || defined(NNTOOL_IOS)
	    //set off measurement start callback
	    pCallback->callbackToPlatform("started", "", 0, "");
	#endif
	std::unique_ptr<CMeasurement> pMeasurement = std::make_unique<CMeasurement>( pConfig.get(), pXml.get(), pService.get(), conf.sProvider, nTestCase, pCallback.get());
	pMeasurement->startMeasurement();
}

void shutdown()
{
	usleep(1000000);

	::RUNNING = false;

	TRC_INFO("Status: ias-client stopped");

	#if !defined(__ANDROID__) && !defined(NNTOOL_IOS)
        exit(EXIT_SUCCESS);
	#endif
}

void show_usage(char* argv0)
{
	cout<< "                                                 				" <<endl;
	cout<< "Usage: " << argv0 << " [ options ... ]           				" <<endl;
	cout<< "                                                 				" <<endl;
	cout<< "  -r             - Perform RTT measurement       				" <<endl;
	cout<< "  -d             - Perform Download measurement  				" <<endl;
	cout<< "  -u             - Perform Upload measurement    				" <<endl;
	cout<< "  -p port        - Target Port to use    						" <<endl;
	cout<< "  -t             - Enable TLS for TCP Connections               " <<endl;
	#if !defined(__APPLE__)
	cout<< "  -n             - Show debugging output	 	 				" <<endl;
	#endif
	cout<< "  -h             - Show Help                     				" <<endl;
	cout<< "  -v             - Show Version                  				" <<endl;
	cout<< "  -a token       - Auth token	                  				" <<endl;
	cout<< "  -m timestamp   - Auth token timestamp            				" <<endl;
	cout<< "                                                 				" <<endl;

    exit(EXIT_FAILURE);
}

static void signal_handler(int signal)
{
    hasError = true;

	TRC_ERR("Error signal received " + std::to_string(signal));

    #ifndef __ANDROID__
	    CTool::print_stacktrace();
	#endif
	
    ::RUNNING = false;

    if (signalFunction != nullptr) {
        signalFunction(signal);
    }

    #ifndef __ANDROID__
        sleep(1);
        exit(signal);
    #endif

}
