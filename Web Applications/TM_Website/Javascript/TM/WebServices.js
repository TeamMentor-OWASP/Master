//global objects

TM.tmWebServices = '/Aspx_Pages/TM_WebServices.asmx/';
TM.WebServices.Data.lastDataReceived = {};
TM.WebServices.Config.Version = "v0.3";
TM.WebServices.Config.CSRF_Token = "";

//Helpers
TM.WebServices.Helper.invokeWebService = function(url, params, handleData, handleError)
{										
	if (typeof(handleData) == "undefined") 
    {   
		handleData = TM.WebServices.Helper.defaultCallback;
	}
	if (typeof(handleError) == "undefined")	
	{
		handleError = TM.WebServices.Helper.defaultErrorHandler;		
	}
    $.ajax( {
					type            : "POST"
				,   url             : url
				,	data            : params                
				,	headers			: { "CSRF-Token" : TM.WebServices.Config.CSRF_Token}
				,	contentType: "application/json; charset=utf-8"
				,	dataType: "json"
				,	success: function (msg) 
						{   													
							TM.WebServices.Data.lastDataReceived = msg;				
							if(typeof(msg.d) == "undefined")
								handleError("No data received from call to: " + url);
							else
								handleData(msg)			
						}
				,	failure: function (msg) 
						{						
							handleError(msg);            
						}
				,	error: function (msg) 
						{
							handleError(msg);					
						}
			});
}

TM.WebServices.Helper.showUserMessage = function(msg)
	{
		console.log("Error: in showUserMessage (this function shouldn't be used here)");
	};


TM.WebServices.Helper.defaultErrorHandler = function(msg)		// this method should be overriden by a better GUI handler
	{			
		try
		{
			if (isDefined(msg) && isDefined(msg.responseText))
			{
				msg = msg.responseText;		
				var parsedMsg = JSON.parse(msg)
				if(isDefined(parsedMsg) && isDefined(parsedMsg.Message))
					TM.Gui.Dialog.alertUser(parsedMsg.Message, "WebServices Error")
			}
			console.log("TM.WebServices.Helper.defaultErrorHandler: " + msg);
		}
		catch(error)    
		{		
			console.log("TM.WebServices.Helper.defaultErrorHandler: error in defaultErrorHandler: " + error.message);
		}
	}

TM.WebServices.Helper.defaultCallback = function(msg)		// this method should be overriden by a better GUI handler
	{
		console.log("Error: WebServices result: " + msg.d);
	}

TM.WebServices.Helper.invoke_TM_WebService = function(method, params, callback, handleError)
	{
		var url = TM.tmWebServices + method					
		if(typeof(params) === "object")
			params = JSON.stringify( params );			
		TM.WebServices.Helper.invokeWebService( 
				url, 
				params, 
				function(data)  {					
									if (typeof(callback) != "undefined")
										callback(data.d);
								},
				handleError);		
	}
	
//extension method that does the same as the previous method (via a simpler invocation)
String.prototype.invokeWebService = function( params, callback, onError) 
	{
		TM.WebServices.Helper.invoke_TM_WebService(this, params, callback, onError);
	};
//*********** WebServices ****************


//*********************** 
//TM.WebServices.WS_Utils
//***********************

TM.WebServices.WS_Utils.getTime = function (callback)
	{		
		TM.WebServices.Helper.invoke_TM_WebService('GetTime', {}, callback);
	}


//**********************	
//TM.WebServices.WS_Data
//**********************

TM.WebServices.WS_Data.getGUIObjects = function (callback)
	{				
		var startTime = new Date();				
		TM.WebServices.Helper.invoke_TM_WebService(
			'GetGUIObjects', 
			{},
			function(data)  {								
								TM.Debug.TimeSpan_WebService_getGUIObjects = new Date(new Date() - startTime);
								TM.WebServices.Data.GuiObjects = data;
								if (typeof(callback) != "undefined")
									callback(TM.WebServices.Data.GuiObjects);
							});
	}
	
TM.WebServices.WS_Data.getFolderStructure = function (callback)
	{				
		var startTime = new Date();		
		TM.WebServices.Helper.invoke_TM_WebService(
			'GetFolderStructure_Libraries', 
			{}, 
			function(data)  {
								TM.Debug.TimeSpan_WebService_getFolderStructure = new Date(new Date() - startTime);
								TM.WebServices.Data.folderStructure = data;
								if (typeof(callback) != "undefined")
									callback(TM.WebServices.Data.folderStructure);
								TM.Events.onFolderStructureMapped();
							});
	}	
	
TM.WebServices.WS_Data.getJsTreeWithFolders = function(callback)
{			
	if (TM.Debug.reuseLibraryMappingsObject && 
		isDefined(TM.WebServices.Data.jsTreeWithFolders))
	{
		callback(TM.WebServices.Data.jsTreeWithFolders);
		return;
	}
	TM.WebServices.Helper.invoke_TM_WebService(
			'JsTreeWithFolders', 
			{}, 
		function(data)  {							
							TM.WebServices.Data.jsTreeWithFolders = data;							
							if (typeof(callback) != "undefined")
								callback(TM.WebServices.Data.jsTreeWithFolders);
						});	
}	


//***********************
//TM.WebServices.WS_Users
//***********************
TM.WebServices.WS_Users.createUser = function(username , passwordHash,  email, firstname, lastname, note, callback)
	{		
		var params =  { newUser: { 		username: username, 
										passwordHash: passwordHash,
										email: email, 
										firstname:  firstname,
										lastname:  lastname,
										note: note				} };
		TM.WebServices.Helper.invoke_TM_WebService(
			'CreateUser', 
			params, 		
			function(data)  {														
								if (typeof(callback) != "undefined")
									callback(data);
							});		
	}

TM.WebServices.WS_Users.setUserGroupID = function(userId , groupId, callback)
	{		
		var params =  { userId: userId , roleId : groupId };
		TM.WebServices.Helper.invoke_TM_WebService(
			'SetUserGroupId', 
			params, 		
			function(data)  {														
								if (typeof(callback) != "undefined")
									callback(data);
							});		
	}


TM.WebServices.WS_Users.login = function(username, password, callback)
	{			
		if(isUndefined(callback))
			callback = function() {};
		var passwordHash = SHA256(username + password)	
		var params =  { username : username  , passwordHash : passwordHash } ;			
		
		TM.WebServices.Helper.invoke_TM_WebService(
			'Login', 
			params, 
			function(result)
				{
					//TM.Events.onUserChange();
					callback(result)
				});		
	};

TM.WebServices.WS_Users.logout = function(username, password, callback)
	{			
		if(isUndefined(callback))
		{
			callback = function() {}
		}
		
		TM.WebServices.Helper.invoke_TM_WebService(
			'Logout', 
			{}, 
			function() 
			{				
				TM.Events.onUserChange();
				callback();
			});		
	};
	
	

TM.WebServices.WS_Users.currentUser = function(callback)
	{				
		TM.WebServices.Helper.invoke_TM_WebService('Current_User', {} , callback);		
	}	
	
TM.WebServices.WS_Users.currentUserRoles = function(callback)
	{
		TM.WebServices.Helper.invoke_TM_WebService('RBAC_CurrentPrincipal_Roles', {} , callback);				
	}	
	
TM.WebServices.WS_Users.user_by_Id = function(userId, callback)
	{
		var params =  { userId : userId }; 
		TM.WebServices.Helper.invoke_TM_WebService('GetUser_byID', params, callback);		
	};

TM.WebServices.WS_Users.user_by_Name = function(userName, callback)
	{
		var params =  { name : userName } ;
		TM.WebServices.Helper.invoke_TM_WebService('GetUser_byName', params, callback);		
	};
	
TM.WebServices.WS_Users.deleteUser = function(userId, callback)
	{		
		var params =  { userId : userId };					
		TM.WebServices.Helper.invoke_TM_WebService('DeleteUser', params, callback);				
	}

TM.WebServices.WS_Users.getUsers = function(callback, errorHandler)
	{								
		TM.WebServices.Helper.invoke_TM_WebService(
			'GetUsers', 
			{}, 		
			function(data)  {																
								if (typeof(callback) != "undefined")
									callback(data);							
							} ,	
			errorHandler);
	}


//SSO
TM.WebServices.WS_Users.login_usingSSOToken = function(ssoToken)
    {
        var callback = function(guid)
            {
                if(guid===TM.Const.emptyGuid)
                    TM.Gui.Dialog.alertUser("SSO (Single-Sign-On) failed");
                else
                {
                    //TM.Gui.Dialog.alertUser("SSO (Single-Sign-On) succeeded");
                    TM.Gui.CurrentUser.loadUserData();
                }
            
            }
        TM.WebServices.Helper.invoke_TM_WebService("SSO_AuthenticateUser",{ssoToken:ssoToken},callback)
    }

TM.WebServices.WS_Users.login_asUser = function(userName)
    {
        var callback = function(ssoToken)
            {   
                if(ssoToken != null)
                    TM.WebServices.WS_Users.login_usingSSOToken(ssoToken);
            }
        TM.WebServices.Helper.invoke_TM_WebService("SSO_GetSSOTokenForUser",{userName:userName},callback)
    } 


	
//***********************
//TM.WebServices.WS_Libraries
//***********************	


//GET 

TM.WebServices.WS_Libraries.get_Libraries = function(callback, errorHandler)
{
    TM.WebServices.Helper.invoke_TM_WebService("GetLibraries", "{}",callback, errorHandler);
}


//ADD

TM.WebServices.WS_Libraries.add_Library = function(libraryName, callback, errorHandler)
{	
	var params = { library : { 
								id: "00000000-0000-0000-0000-000000000000", 
								caption : libraryName 
							 } };
	TM.WebServices.Helper.invoke_TM_WebService(
			'CreateLibrary', 
			params, 		
			function(data)  {																
								if (typeof(callback) != "undefined")
									callback(data);							
							} ,	
			errorHandler);
}	

TM.WebServices.WS_Libraries.add_Folder = function(libraryId, parentFolderId, newFolderName, callback , errorHandler)
{	
	if (typeof(parentFolderId) == "undefined")
		parentFolderId = "00000000-0000-0000-0000-000000000000";
	var params = { 
					libraryId : libraryId   , 
					parentFolderId: parentFolderId , 
					newFolderName : newFolderName 
				 }; 
	TM.WebServices.Helper.invoke_TM_WebService(
			'CreateFolder', 
			params, 		
			function(data)  {																
								if (typeof(callback) != "undefined")
									callback(data);							
							} ,	
			errorHandler);
}	

TM.WebServices.WS_Libraries.add_Folder = function(libraryId, parentFolderId, newFolderName, callback , errorHandler)
{	
	if (typeof(parentFolderId) == "undefined")
		parentFolderId = "00000000-0000-0000-0000-000000000000";
	var params = { 
					libraryId : libraryId   , 
					parentFolderId: parentFolderId , 
					newFolderName : newFolderName 
				 }; 
	TM.WebServices.Helper.invoke_TM_WebService(
			'CreateFolder', 
			params, 		
			function(data)  {																
								if (typeof(callback) != "undefined")
									callback(data);							
							} ,	
			errorHandler);
}	

TM.WebServices.WS_Libraries.add_View = function(libraryId, folderId, viewName, callback , errorHandler)
{	
	if (typeof(folderId) == "undefined")
		folderId = "00000000-0000-0000-0000-000000000000";
		
	var params = {	
					folderId : folderId,  
				    view : { 
								id: "00000000-0000-0000-0000-000000000000", 
								parentFolder : "" , 
								caption : viewName ,								
								creatorCaption : "guidanceLibrary" , 
								criteria : "", 
								library: libraryId 
							} 
				 };
					
	TM.WebServices.Helper.invoke_TM_WebService(
			'CreateView', 
			params, 		
			function(data)  {																
								if (typeof(callback) != "undefined")
									callback(data);							
							} ,	
			errorHandler);
}	

TM.WebServices.WS_Libraries.add_Article_Simple = function(libraryId, title, dataType, htmlCode, callback , errorHandler)
{		
	var params = { 
					libraryId   : libraryId , 
					title       : title , 
                    dataType    : dataType,
					htmlCode    : htmlCode 
				 };     
	TM.WebServices.Helper.invoke_TM_WebService('CreateArticle_Simple', params, 	callback, 	errorHandler);
}


// SET

TM.WebServices.WS_Libraries.set_Article_Html = function (articleId, htmlCode, callback,errorHandler)
{
    var params = { articleId : articleId , htmlCode: htmlCode } ;
    TM.WebServices.Helper.invoke_TM_WebService("SetArticleHtml",params, callback,errorHandler);
}

TM.WebServices.WS_Libraries.set_Article_Content = function (articleId, dataType, content, callback,errorHandler)
{
    var params = { articleId : articleId , dataType:dataType , content: content } ;
    TM.WebServices.Helper.invoke_TM_WebService("SetArticleContent",params, callback,errorHandler);
}

//RENAME

TM.WebServices.WS_Libraries.rename_Library = function(libraryId, newName, callback , errorHandler)
{		
	var params = { library : { 
						id : libraryId ,
						caption  : newName } };
	TM.WebServices.Helper.invoke_TM_WebService('UpdateLibrary', params, callback, errorHandler);
}

TM.WebServices.WS_Libraries.rename_Folder = function(libraryId, folderId, newFolderName, callback , errorHandler)
{		
	var params = { 	libraryId 	   : libraryId , 
					folderId  	   : folderId  , 
					newFolderName  : newFolderName };	
	TM.WebServices.Helper.invoke_TM_WebService('RenameFolder', params, callback, errorHandler);
}

TM.WebServices.WS_Libraries.rename_View = function(libraryId, folderId, viewId,viewName, callback , errorHandler)
{		
	var params = { view : {   id			 : viewId , 
							  parentFolder 	 : folderId ,
							  caption 		 : viewName,
							  creatorCaption : "guidanceLibrary" , 
							  criteria 		 : "", 
							  library		 : libraryId } };							
	TM.WebServices.Helper.invoke_TM_WebService('UpdateView', params, callback, errorHandler);
}

function renameView(libraryId, viewId, parentFolder, viewName, callback)
{
	var url = TM.tmWebServices + 'UpdateView';
	var params = 
	invokeWebService( url, params, callback, defaultErrorHandler);
}


//REMOVE 
TM.WebServices.WS_Libraries.remove_Library = function(libraryId, callback, errorHandler)
{	
	var params = { libraryId : libraryId };	
	TM.WebServices.Helper.invoke_TM_WebService('DeleteLibrary', params, callback,errorHandler);
}

TM.WebServices.WS_Libraries.remove_Folder = function(libraryId, folderId, callback, errorHandler)
{	
	var params = { libraryId : libraryId , folderId :folderId };	
	TM.WebServices.Helper.invoke_TM_WebService('DeleteFolder', params, callback,errorHandler);
}

TM.WebServices.WS_Libraries.remove_View = function(libraryId, viewId, callback, errorHandler)
{	
	var params = { libraryId : libraryId , viewId : viewId};		
	TM.WebServices.Helper.invoke_TM_WebService('RemoveViewFromFolder', params, callback,errorHandler); 			
}

TM.WebServices.WS_Libraries.remove_GuidanceItem = function(guidanceItemId, callback, errorHandler)
{	
	var params = { guidanceItemId : guidanceItemId };		
	TM.WebServices.Helper.invoke_TM_WebService('DeleteGuidanceItem', params, callback,errorHandler); 			
}

TM.WebServices.WS_Libraries.remove_GuidanceItems = function(guidanceItemIds, callback, errorHandler)
{	
	var params = { guidanceItemIds : guidanceItemIds };		
	TM.WebServices.Helper.invoke_TM_WebService('DeleteGuidanceItems', params, callback,errorHandler); 			
}
